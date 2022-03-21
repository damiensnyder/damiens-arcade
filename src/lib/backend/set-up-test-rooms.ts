import type RoomManager from "./room-manager";
import { readFileSync } from "fs";
import type { Action, RoomSettings } from "$lib/types";

interface TestRoomAction extends Action {
  pov: number
}

interface TestRoomScript extends RoomSettings {
  actions: TestRoomAction[]
}

export default function setUpTestRooms(roomManager: RoomManager) {
  const testFileText = readFileSync("src/lib/backend/test-rooms.json").toString();
  const roomScripts: TestRoomScript[] = JSON.parse(testFileText)['rooms'];
  for (const roomScript of roomScripts) {
    const { roomCode } = roomManager.createRoom(roomScript);
    const room = roomManager.activeRooms[roomCode];
    for (const action in roomScript.actions) {
      room.handleGameAction(action.pov, action);
    }
  }
}