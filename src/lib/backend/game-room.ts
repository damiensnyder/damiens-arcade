import type { Namespace, Server, Socket } from "socket.io";
import AuctionTicTacToe from "./auction-tic-tac-toe";
import GameLogicHandler from "./game-logic-handler";
import { GameType, PacketInfo, PublicRoomInfo as PublicRoomInfo, TeardownCallback, Viewer, PacketType } from "../types";

const TEARDOWN_TIME: number = 60 * 60 * 1000; // one hour

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
      if (typeof data === "object" && typeof data.type === "string") {
        if (data.type !== "changeGameType" || !this.changeGameType(data.data)) {
          this.gameLogicHandler.handleAction(viewer, data.type, data.data);
        }
      }
    } else if (type === PacketType.Connect) {
      this.gameLogicHandler.handleConnect(viewer);
      if (this.viewers.length === 1) {
        this.host = viewer.index;
      }
    } else if (type === PacketType.Disconnect) {
      const wasHost = this.host === viewer.index
      if (wasHost) {
        if (this.viewers.length === 0) {
          this.host = null;
        } else {
          this.host = this.viewers[0].index;
        }
      }
      this.gameLogicHandler.handleDisconnect(viewer, wasHost);
    }

    clearTimeout(this.teardownTimer);
    this.teardownTimer = setTimeout(
        () => this.teardownCallback(this.basicRoomInfo.roomCode),
        TEARDOWN_TIME
    );
    
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

  // Change to a new type of game
  changeGameType(newGameType: any): boolean {
    // if the game type is invalid, return false
    if (this.basicRoomInfo.roomState.gameStatus !== "pregame" ||
        !newGameType ||
        typeof newGameType.to !== "string" ||
        !Object.values(GameType).includes(newGameType.to)) {
      return false;
    }
    // otherwise, change the game type 
    this.basicRoomInfo.roomState.gameType = newGameType.to;
    if (newGameType === GameType.None) {
      this.gameLogicHandler = new GameLogicHandler(this);
    } else if (newGameType === GameType.AuctionTTT) {
      this.gameLogicHandler = new AuctionTicTacToe(this);
    }
    return true;
  }
}
