import type RoomManager from "./room-manager";
import { readFileSync } from "fs";
import type { PacketType, PublicRoomInfo } from "$lib/types";
import type { Socket } from "socket.io";

export interface TestRoomAction {
  type: string,
  data?: any,
  viewerIndex: number
}

interface TestRoomScript extends PublicRoomInfo {
  actions: TestRoomAction[]
}

export default function setUpTestRooms(roomManager: RoomManager) {
  const testFileText = readFileSync("src/lib/backend/test-rooms.json").toString();
  const roomScripts: TestRoomScript[] = JSON.parse(testFileText)['rooms'];
  for (const roomScript of roomScripts) {
    const { roomCode } = roomManager.createRoom();
    const room = roomManager.activeRooms[roomCode];
    room.host = -1;
    for (const action of roomScript.actions) {
      room.enqueuePacket(
        {
          index: action.viewerIndex,
          socket: new FakeSocket() as unknown as Socket
        },
        action.type as PacketType,
        action.data
      );
    }
    room.host = null;
  }
}

class FakeSocket {
  constructor() {}
  emit() {}
}