<script lang="ts">
import type { AuctionTTTGamestate } from "./backend/auction-tic-tac-toe";
import type { Action } from "./types";

export let gamestate: AuctionTTTGamestate;
export let socketCallback: (action: Action) => void;

const clientSideGamestate = gamestate;

function actionCallback(action: Action) {
  socketCallback(action);

  if (action.type === "nominate") {
    // figure it out later
  } else if (action.type === "bid") {
    // figure it out later
  } else if (action.type === "pass") {
    // figure it out later
  } else if (action.type === "join") {
    // figure it out later
  } else if (action.type === "leave") {
    // figure it out later
  } else if (action.type === "editSettings") {
    // figure it out later
  }
}
</script>