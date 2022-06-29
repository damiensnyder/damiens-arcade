import type RoomManager from "$lib/backend/room-manager";
import { readFileSync, readdirSync } from "fs";
import { PacketType, type Action, type Viewer } from "$lib/types";
import type { Socket } from "socket.io";
import type GameRoom from "$lib/backend/game-room";

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

interface MacroAction {
  macro: string
  dynamicParams: any[]
}

interface TestRoomScript {
  actions: (ActionWithIndex | MacroAction)[]
  seed: [number, number, number, number]
  expected?: any
}

let macros: Record<string, (ActionWithIndex | MacroAction)[]>;

export default function setUpTestRooms(roomManager: RoomManager) {
  const testFiles = readdirSync("src/lib/test/cases");
  for (const fileName of testFiles) {
    // macros is re-read each time because it gets mutated between uses
    macros = JSON.parse(readFileSync("src/lib/test/macros.json").toString());
    const testFileText = readFileSync("src/lib/test/cases/" + fileName).toString();
    const roomScript: TestRoomScript = JSON.parse(testFileText);
    roomManager.createRoom(fileName.split(".")[0], roomScript.seed);
    const room = roomManager.activeRooms[fileName.split(".")[0]];
    setUpTestRoom(room, roomScript);
  }
}

async function setUpTestRoom(room: GameRoom, roomScript: TestRoomScript): Promise<void> {
  for (const action of roomScript.actions) {
    enqueueAction(action as ActionWithIndex, room);
    await sleep(1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function enqueueAction(action: ActionWithIndex | MacroAction, room: GameRoom) {
  if ("macro" in action) {
    const macroApplied = macros[action.macro];
    for (const macroAction of macroApplied) {
      let editedAction = macroAction as any;
      if (editedAction.dynamicParams !== undefined) {
        const dynamicParams = editedAction.dynamicParams;
        delete editedAction.dynamicParams;
        for (const [key, index] of Object.entries(dynamicParams)) {
          editedAction[key] = action.dynamicParams[index as number];
        }
      }
      enqueueAction(editedAction, room);
    }
  } else {
    const fakeViewer: Viewer = {
      index: action.index + 0.5,
      socket: new FakeSocket() as unknown as Socket
    };
    if (action["_index"] !== undefined) {
      action.index = action["_index"];
      delete action["_index"];
    } else {
      delete action.index;
    }
    if (action.type === PacketType.Connect) {
      room.viewers.push(fakeViewer);
      room.enqueuePacket(fakeViewer, action.type);
    } else if (action.type === PacketType.Disconnect) {
      room.enqueuePacket(fakeViewer, action.type);
    } else {
      try {
        room.enqueuePacket(fakeViewer, PacketType.Action, action as Action);
      } catch (e) {
        console.log(e);
        console.log(action);
      }
    }
  }
}

class FakeSocket {
  constructor() {}
  emit() {}
}