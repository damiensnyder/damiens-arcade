import type { Namespace, Server, Socket } from "socket.io";
import AuctionTicTacToe from "./auction-tic-tac-toe";
import GameLogicHandler from "./game-logic-handler";
import { GameType, PacketInfo, BasicRoomInfo, TeardownCallback, Viewer, PacketType } from "../types";

const TEARDOWN_TIME: number = 60 * 60 * 1000; // one hour

export default class GameRoom {
  basicRoomInfo: BasicRoomInfo;
  gameLogicHandler: GameLogicHandler;
  viewers: Viewer[];
  connectionsStarted: number;
  handlingPacket: boolean;
  private packetQueue: PacketInfo[];
  private readonly teardownCallback: TeardownCallback;
  private readonly io: Namespace;
  private teardownTimer: NodeJS.Timeout;

  constructor(
    io: Server,
    roomSettings: BasicRoomInfo,
    teardownCallback: TeardownCallback
  ) {
    this.viewers = [];
    this.connectionsStarted = 0;

    this.io = io.of(`/game/${roomSettings.roomCode}`);
    this.io.on('connection', (socket: Socket) => {
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
      () => this.teardownCallback(roomSettings.roomCode),
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
    
    this.gameLogicHandler.handlePacket(viewer.index, type, data);

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
  publicRoomState(): BasicRoomInfo {
    return {
      ...this.basicRoomInfo,
      roomState: this.gameLogicHandler.publicRoomState()
    };
  }

  // Change to a new type of game
  changeGameType(newGameType: GameType) {
    this.basicRoomInfo.roomState.gameType = newGameType;
    if (newGameType === GameType.None) {
      this.gameLogicHandler = new GameLogicHandler(this);
    } else if (newGameType === GameType.AuctionTTT) {
      this.gameLogicHandler = new AuctionTicTacToe(this);
    }
  }
}
