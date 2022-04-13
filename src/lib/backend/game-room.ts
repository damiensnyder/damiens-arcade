import type { Namespace, Server, Socket } from "socket.io";
import type GameLogicHandler from "./game-logic-handler-base";
import AuctionTicTacToe from "../auction-tic-tac-toe/game-logic-handler";
import NoGameSelected from "../no-game-selected/game-logic-handler";
import { GameType, PacketType } from "../types";
import type { PacketInfo, PublicRoomInfo, TeardownCallback, Viewer } from "../types";
import { boolean, object, string } from "yup";

const TEARDOWN_TIME: number = 60 * 60 * 1000; // one hour

const changeGameTypeSchema = object({
  type: string().required().equals(["changeGameType"]),
  newGameType: string().required().oneOf(Object.values(GameType))
});

const changeSettingsSchema = object({
  type: string().equals(["changeRoomSettings"]),
  roomName: string().required(),
  isPublic: boolean().required()
});

export default class GameRoom {
  basicRoomInfo: PublicRoomInfo;
  gameLogicHandler: GameLogicHandler;
  viewers: Viewer[];
  host?: number
  connectionsStarted: number;
  handlingPacket: boolean;
  private packetQueue: PacketInfo[];
  private readonly teardownCallback: TeardownCallback;
  private readonly io: Namespace;
  private teardownTimer: NodeJS.Timeout;

  constructor(
    io: Server,
    roomCode: string,
    teardownCallback: TeardownCallback
  ) {
    this.viewers = [];
    this.connectionsStarted = 0;
    this.basicRoomInfo = {
      roomCode: roomCode,
      roomName: "Untitled Room",
      isPublic: false,
      roomState: {
        gameType: GameType.NoGameSelected,
        gameStatus: "pregame"
      }
    };
    this.gameLogicHandler = new NoGameSelected(this);

    this.io = io.of(`/game/${roomCode}`);
    this.io.on("connection", (socket: Socket) => {
      // on a new connection, add the viewer to the list of viewers
      const viewer = {
        socket: socket,
        index: this.connectionsStarted
      };
      this.viewers.push(viewer);
      this.connectionsStarted++;

      // enqueue any disconnects the viewer sends, and remove them from the viewer list after
      viewer.socket.on("disconnect", () => {
        this.enqueuePacket.bind(this)(viewer, "disconnect");
      });

      // enqueue any actions the viewer sends
      viewer.socket.on("action", (data: unknown) => {
        this.enqueuePacket.bind(this)(viewer, "action", data);
      });
      
      // enqueue the connection
      this.enqueuePacket.bind(this)(viewer, 'connect');
    });

    this.packetQueue = [];
    this.handlingPacket = false;
    this.teardownCallback = teardownCallback;
    this.teardownTimer = setTimeout(
      () => this.teardownCallback(roomCode),
      TEARDOWN_TIME
    );
  }

  // Sends actions to a queue, which is handled one at a time so the items
  // don't interfere with each other.
  enqueuePacket(viewer: Viewer, packetType: PacketType, data?: unknown): void {
    this.packetQueue.push({
      viewer: viewer,
      type: packetType,
      data: data
    });

    if (!this.handlingPacket) {
      this.handlingPacket = true;
      this.handlePacket();
    }
  }

  // Handle the first packet in the queue. If there are no more packets in the
  // queue, show that the queue is empty. Otherwise, handle the next packet.
  handlePacket(): void {
    const { viewer, type, data } = this.packetQueue.splice(0, 1)[0];

    console.debug(`${viewer.index}\t${type}`);
    console.debug(data);
    
    if (type === PacketType.Action) {
      // if the action is changing something basic about the room, handle that manually
      if (this.shouldChangeGameType(viewer, data)) {
        this.changeGameType(data.newGameType);
      } else if (this.shouldChangeSettings(viewer, data)) {
        this.changeSettings(data);
      } else {
        // otherwise, pass it on to the game logic handler
        this.gameLogicHandler.handleAction(viewer, data);
      }
    } else if (type === PacketType.Connect) {
      // if someone connects and there is no host, make them the host
      if (this.host == null) {
        this.host = viewer.index;
      }
      this.gameLogicHandler.handleConnect(viewer);
    } else if (type === PacketType.Disconnect) {
      // remove the viewer from this list of viewers
      this.viewers = this.viewers.filter((v) => v.index !== viewer.index);
      // if the player disconnecting was the host, pick a new host if possible
      const wasHost = this.host === viewer.index;
      if (wasHost) {
        if (this.viewers.length === 0) {
          this.host = null;
        } else {
          this.host = this.viewers[0].index;
        }
      }
      this.gameLogicHandler.handleDisconnect(viewer, wasHost);
    }

    // reset the timer for tearing down this room
    clearTimeout(this.teardownTimer);
    this.teardownTimer = setTimeout(
        () => this.teardownCallback(this.basicRoomInfo.roomCode),
        TEARDOWN_TIME
    );
    
    // if there is another packet, handle it
    if (this.packetQueue.length > 0) {
      this.handlePacket();
    } else {
      this.handlingPacket = false;
    }
  }

  // Return the information shown in the joiner
  publicRoomState(): PublicRoomInfo {
    return {
      ...this.basicRoomInfo,
      roomState: this.gameLogicHandler.publicRoomState()
    };
  }

  shouldChangeSettings(viewer: Viewer, data?: any): boolean {
    return viewer.index === this.host &&
        this.gameLogicHandler.gameStatus === "pregame" &&
        changeSettingsSchema.isValidSync(data);
  }

  changeSettings(newSettings: { roomName: string, isPublic: boolean }): void {
    newSettings.roomName = newSettings.roomName.trim()
    if (newSettings.roomName.length === 0) {
      newSettings.roomName = "Untitled Room";
    }
    if (newSettings.roomName !== undefined) {
      this.basicRoomInfo.roomName = newSettings.roomName;
    }
    if (newSettings.isPublic !== undefined) {
      this.basicRoomInfo.isPublic = newSettings.isPublic;
    }

    this.gameLogicHandler.emitEventToAll({
      type: "changeRoomSettings",
      roomName: newSettings.roomName,
      isPublic: newSettings.isPublic
    });
  }

  shouldChangeGameType(viewer: Viewer, data?: any) {
    return viewer.index === this.host &&
        this.gameLogicHandler.gameStatus === "pregame" &&
        changeGameTypeSchema.isValidSync(data) &&
        data.newGameType !== this.basicRoomInfo.roomState.gameType;
  }

  // Change to a new type of game
  changeGameType(newGameType: GameType): void {
    this.basicRoomInfo.roomState.gameType = newGameType;
    if (newGameType === GameType.NoGameSelected) {
      this.gameLogicHandler = new NoGameSelected(this);
    } else if (newGameType === GameType.AuctionTTT) {
      this.gameLogicHandler = new AuctionTicTacToe(this);
    }

    this.gameLogicHandler.emitEventToAll({
      type: "changeGameType",
      gameType: newGameType
    });
  }
}
