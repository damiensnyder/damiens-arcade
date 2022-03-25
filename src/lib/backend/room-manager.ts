import GameRoom from "./game-room";
import type { BasicRoomInfo } from "../types";
import type { Server } from "socket.io";

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
  createRoom(): { roomCode: string } {
    const roomCode = this.generateRoomCode();

    this.activeRooms[roomCode] = new GameRoom(
      this.io,
      roomCode,
      this.teardownCallback.bind(this)
    );

    return { roomCode: roomCode };
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

  listActiveRooms(): { rooms: BasicRoomInfo[] } {
    const activeRooms: BasicRoomInfo[] = [];

    for (const [, room] of Object.entries(this.activeRooms)) {
      const roomInfo = room.publicRoomState();
      if (!roomInfo.isPrivate) {
        activeRooms.push(roomInfo);
      }
    }
    
    return { rooms: activeRooms };
  }
}
