import type RoomManager from "./room-manager";
import { readFileSync } from "fs";
import { PacketType, type Action, type Viewer } from "$lib/types";
import type { Socket } from "socket.io";

interface ConnectAction {
  type: PacketType.Connect
}

interface DisconnectAction {
  type: PacketType.Disconnect
}

export type TestRoomAction = ConnectAction | DisconnectAction;

interface HasViewerIndex {
  index: number
}

type ActionWithIndex = Action & HasViewerIndex;

interface TestRoomScript {
  actions: ActionWithIndex[]
}

export default function setUpTestRooms(roomManager: RoomManager) {
  const testFileText = readFileSync("src/lib/backend/test-rooms.json").toString();
  const roomScripts: TestRoomScript[] = JSON.parse(testFileText)['rooms'];
  for (const roomScript of roomScripts) {
    const roomCode = roomManager.createRoom().roomCode;
    const room = roomManager.activeRooms[roomCode];

    for (const action of roomScript.actions) {
      const fakeViewer: Viewer = {
        index: -1 * action.index,
        socket: new FakeSocket() as unknown as Socket
      };
      delete action.index;
      if (action.type === PacketType.Connect) {
        room.viewers.push(fakeViewer);
        room.enqueuePacket(fakeViewer, action.type);
      } else if (action.type === PacketType.Disconnect) {
        room.enqueuePacket(fakeViewer, action.type);
      } else {
        room.enqueuePacket(fakeViewer, PacketType.Action, action as Action);
      }
    }
  }
}

class FakeSocket {
  constructor() {}
  emit() {}
}