import type { Namespace, Server, Socket } from "socket.io";
import { jwtVerify } from "jose";
import cookie from "cookie";
import { readFileSync } from "fs";
import type GameLogicHandler from "./game-logic-handler-base";
import AuctionTicTacToe from "../auction-tic-tac-toe/game-logic-handler";
import { GameType, PacketType } from "../types";
import type { PacketInfo, PublicRoomInfo, TeardownCallback, Viewer } from "../types";
import { z } from "zod";
import MayhemManager from "../mayhem-manager/game-logic-handler";

const TEARDOWN_TIME: number = 60 * 60 * 1000; // one hour
const JWT_SECRET = Buffer.from(
  JSON.parse(readFileSync("secrets/secrets.json").toString())["SIGNING_KEY"]
);

const changeSettingsSchema = z.object({
  type: z.literal("changeRoomSettings"),
  roomName: z.string()
      .trim()
      .min(1, "Room name must be at least one character long.")
      .max(50, "Room name cannot be longer than 50 characters."),
  isPublic: z.boolean()
});

export default class GameRoom {
  publicRoomInfo: PublicRoomInfo;
  gameLogicHandler: GameLogicHandler;
  viewers: Viewer[];
  host?: number
  connectionsStarted: number;
  handlingPacket: boolean;
  private packetQueue: PacketInfo[];
  private readonly teardownCallback: TeardownCallback;
  private readonly io: Namespace;
  private teardownTimer: NodeJS.Timeout;
  readonly seed: [number, number, number, number];

  constructor(
    io: Server,
    roomCode: string,
    teardownCallback: TeardownCallback,
    gameType: GameType,
    seed?: [number, number, number, number]
  ) {
    this.viewers = [];
    this.connectionsStarted = 0;
    this.publicRoomInfo = {
      roomCode: roomCode,
      roomName: "Untitled Room",
      isPublic: false,
      gameType,
      gameStage: "pregame"
    };
    this.seed = seed || [
      Math.random() * 4294967296,
      Math.random() * 4294967296,
      Math.random() * 4294967296,
      Math.random() * 4294967296
    ];
    if (gameType === GameType.AuctionTTT) {
      this.gameLogicHandler = new AuctionTicTacToe(this);
    } else if (gameType === GameType.MayhemManager) {
      this.gameLogicHandler = new MayhemManager(this);
    }

    this.io = io.of(`/${gameType.replaceAll(" ", "-").toLowerCase()}/${roomCode}`);
    this.io.on("connection", async (socket: Socket) => {
      const cookies = cookie.parse(socket.handshake.headers['cookie']);
      const authToken = cookies.auth_token;
      let siteUsername = null;
      if (authToken) {
        try {
          const { payload } = await jwtVerify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
          siteUsername = payload.username;
        } catch (err) {
          console.log(authToken);
        }
      }

      // on a new connection, add the viewer to the list of viewers
      const viewer = {
        socket: socket,
        siteUsername,
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
      try {
        this.handlePacket();
      } catch (e) {
        console.log(e);
        this.teardownCallback(this.publicRoomInfo.roomCode);
      }
    }
  }

  // Handle the first packet in the queue. If there are no more packets in the
  // queue, show that the queue is empty. Otherwise, handle the next packet.
  handlePacket(): void {
    const { viewer, type, data } = this.packetQueue.splice(0, 1)[0];

    if (type === PacketType.Action) {
      // if the action is changing something basic about the room, handle that manually
      if (this.shouldChangeSettings(viewer, data)) {
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
        () => this.teardownCallback(this.publicRoomInfo.roomCode),
        TEARDOWN_TIME
    );
    
    // if there is another packet, handle it
    if (this.packetQueue.length > 0) {
      this.handlePacket();
    } else {
      this.handlingPacket = false;
    }
  }

  shouldChangeSettings(viewer: Viewer, data?: any): boolean {
    return viewer.index === this.host &&
        changeSettingsSchema.safeParse(data).success;
  }

  changeSettings(newSettings: { roomName: string, isPublic: boolean }): void {
    newSettings.roomName = newSettings.roomName.trim()
    if (newSettings.roomName.length === 0) {
      newSettings.roomName = "Untitled Room";
    }
    this.publicRoomInfo.roomName = newSettings.roomName;
    this.publicRoomInfo.isPublic = newSettings.isPublic;

    this.gameLogicHandler.emitEventToAll({
      type: "changeRoomSettings",
      roomName: newSettings.roomName,
      isPublic: newSettings.isPublic
    });
  }
}