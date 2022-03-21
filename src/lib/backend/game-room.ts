import type { Namespace, Server, Socket } from "socket.io";

import type { Gamestate, PacketInfo, RoomInfo, RoomSettings, TeardownCallback, Viewer, Viewpoint } from "../types";

const TEARDOWN_TIME: number = 60 * 60 * 1000; // one hour

export default class GameRoom {
  roomSettings: RoomSettings;
  viewers: Viewer[];
  connectionsStarted: number;
  gamestate: Gamestate;
  handlingPacket: boolean;
  private packetQueue: PacketInfo[];
  private readonly teardownCallback: TeardownCallback;
  private readonly io: Namespace;
  private teardownTimer: NodeJS.Timeout;

  constructor(
    io: Server,
    roomSettings: RoomSettings,
    teardownCallback: TeardownCallback
  ) {
    this.roomSettings = roomSettings;
    this.gamestate = {
      players: []
    };
    this.viewers = [];
    this.connectionsStarted = 0;

    this.io = io.of(`/game/${roomSettings.roomCode}`);
    this.io.on('connection', (socket: Socket) => {
      const viewer = {
        socket: socket,
        pov: this.connectionsStarted
      };
      this.connectionsStarted++;
      this.enqueuePacket.bind(this)(viewer, 'connect');
      viewer.socket.emit("gamestate", this.generateViewpoint.bind(this)(viewer.pov));
    });

    this.packetQueue = [];
    this.handlingPacket = false;
    this.teardownCallback = teardownCallback;
    this.teardownTimer = setTimeout(
      () => this.teardownCallback(this.roomSettings.roomCode),
      TEARDOWN_TIME
    );
  }

  // Sends actions to a queue, which is handled one at a time so the items
  // don't interfere with each other.
  enqueuePacket(viewer: Viewer, packetType: string, data?: unknown): void {
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
    if (type === "connect") {
      // on connection, add viewer to the list of viewers and give its socket new handlers
      this.viewers.push(viewer);
      viewer.socket.on("disconnect", () => {
        this.enqueuePacket.bind(this)(viewer, "disconnect");
      });
      viewer.socket.on("action", (data: unknown) => {
        this.enqueuePacket.bind(this)(viewer, "action", data);
      });
    } else if (type === "disconnect") {
      // on disconnect, remove viewer from the list of viewers and handle its disconnect game logic
      this.viewers = this.viewers.filter((v) => v !== viewer);
      this.handleGameAction(viewer.pov, {
        type: "disconnect"
      });
    } else {
      // if the packet was an action, handle the action's game logic
      this.handleGameAction(viewer.pov, data);
    }

    clearTimeout(this.teardownTimer);
    this.teardownTimer = setTimeout(
        () => this.teardownCallback(this.roomSettings.roomCode),
        TEARDOWN_TIME
    );
    
    if (this.packetQueue.length > 0) {
      this.handlePacket();
    } else {
      this.handlingPacket = false;
    }
  }

  // Emit the current game state to all viewers.
  emitGameStateToAll(): void {
    for (const viewer of this.viewers) {
      viewer.socket.emit("gamestate", this.generateViewpoint(viewer.pov));
    };
  }

  // Handles an action's game logic. Meant to be overridden.
  handleGameAction(_pov: number, _data: unknown) {}

  // Returns the viewpoint of the viewer with the given POV. Meant to be overridden.
  generateViewpoint(_pov: number): Viewpoint {
    return {
      players: this.gamestate.players,
      ...this.roomSettings
    };
  }

  roomInfo(): RoomInfo {
    return {
      numPlayers: this.gamestate.players.length,
      ...this.roomSettings
    };
  }
}
