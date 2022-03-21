import type GameRoom from "./game-room";
import type { RoomInfo } from "../types";
import type { Server } from "socket.io";
import MyGameRoom from "./my-game-room";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export default class RoomManager {
  activeRooms: Record<string, GameRoom>;
  io: Server;

  constructor(io: Server) {
    this.io = io;
    this.activeRooms = {};
  }

  // Called by a game room when it is ready to tear down. Allows the room code
  // to be reused.
  teardownCallback(roomCode: string): void {
    delete this.activeRooms[roomCode];
  }

  // Create a game room and send the room code along with status 200.
  createRoom(body: any): { roomCode: string } {
    const roomSettings = body || {};
    roomSettings.roomCode = this.generateRoomCode();

    if (typeof roomSettings.roomName != "string" || roomSettings.roomName.length === 0) {
      roomSettings.roomName = "Untitled Room";
    }

    this.activeRooms[roomSettings.roomCode] = new MyGameRoom(
      this.io,
      roomSettings,
      this.teardownCallback.bind(this)
    );

    return { roomCode: roomSettings.roomCode };
  }

  // Generate a random sequence of lowercase letters, without colliding with
  // room codes already in use and without being short enough to guess.
  generateRoomCode(): string {
    const numChars: number = ALPHABET.length;
    const roomCodeLength: number = 3 + Math.ceil(
      Math.log(Object.keys(this.activeRooms).length + 2) / Math.log(26)
    );

    let roomCode: string = "";
    while (roomCode === "") {
      for (let i = 0; i < roomCodeLength; i++) {
        roomCode += ALPHABET.charAt(Math.floor(Math.random() * numChars));
      }
      if (this.activeRooms.hasOwnProperty(roomCode)) {
        roomCode = "";
      }
    }
    return roomCode;
  }

  listActiveRooms(): { rooms: RoomInfo[] } {
    const activeRooms: RoomInfo[] = [];

    for (const [, room] of Object.entries(this.activeRooms)) {
      if (!room.roomSettings.isPrivate) {
        activeRooms.push(room.roomInfo());
      }
    }
    
    return { rooms: activeRooms };
  }
}
