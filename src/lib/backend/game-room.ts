import type { Namespace, Server, Socket } from "socket.io";
import AuctionTicTacToe from "./auction-tic-tac-toe";
import GameLogicHandler from "./game-logic-handler";
import { GameType, PacketInfo, PublicRoomInfo as PublicRoomInfo, TeardownCallback, Viewer, PacketType } from "../types";
import { boolean, InferType, object, string } from "yup";

const TEARDOWN_TIME: number = 60 * 60 * 1000; // one hour

const changeGameTypeSchema = object({
  type: string().required().equals(["changeGameType"]),
  newGameType: string().required().oneOf(Object.values(GameType))
});
type ChangeGameTypePacket = InferType<typeof changeGameTypeSchema>;

const changeSettingsSchema = object({
  type: string().equals(["changeRoomSettings"]),
  settings: object({
    roomName: string().required(),
    isPrivate: boolean().required()
  })
});
type ChangeSettingsPacket = InferType<typeof changeSettingsSchema>;

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
      isPrivate: true,
      roomState: {
        gameType: GameType.None,
        gameStatus: "pregame"
      }
    };
    this.gameLogicHandler = new GameLogicHandler(this);

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
        this.viewers = this.viewers.filter((v) => v !== viewer);
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
    
    if (type === PacketType.Action) {
      // if the action is changing something basic about the room, handle that manually
      if (this.shouldChangeGameType(data)) {
        this.changeGameType((data as ChangeGameTypePacket).newGameType as GameType);
      } else if (this.shouldChangeSettings(data)) {
        this.changeSettings((data as ChangeSettingsPacket).settings);
      } else {
        // otherwise, pass it on to the game logic handler
        this.gameLogicHandler.handleAction(viewer, data);
      }
    } else if (type === PacketType.Connect) {
      // if someone connects and no one else is in the room, make them the host
      if (this.viewers.length === 1) {
        this.host = viewer.index;
      }
      this.gameLogicHandler.handleConnect(viewer);
    } else if (type === PacketType.Disconnect) {
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
        this.basicRoomInfo.roomState.gameStatus === "pregame" &&
        changeSettingsSchema.isValidSync(data);
  }

  changeSettings(newSettings: { roomName: string, isPrivate: boolean }): void {
    newSettings.roomName = newSettings.roomName.trim()
    if (newSettings.roomName.length === 0) {
      newSettings.roomName = "Untitled Room";
    }
    this.basicRoomInfo.roomName = newSettings.roomName;
    this.basicRoomInfo.isPrivate = newSettings.isPrivate;
  }

  shouldChangeGameType(viewer: Viewer, data?: any) {
    return viewer.index === this.host &&
        this.basicRoomInfo.roomState.gameStatus === "pregame" &&
        changeGameTypeSchema.isValidSync(data) &&
        (data as ChangeGameTypePacket).newGameType !== this.basicRoomInfo.roomState.gameType;
  }

  // Change to a new type of game
  changeGameType(newGameType: GameType): void {
    this.basicRoomInfo.roomState.gameType = newGameType;
    if (newGameType === GameType.None) {
      this.gameLogicHandler = new GameLogicHandler(this);
    } else if (newGameType === GameType.AuctionTTT) {
      this.gameLogicHandler = new AuctionTicTacToe(this);
    }
  }
}
