<script lang="ts">
import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
import InviteLink from "$lib/invite-link.svelte";
import type { ActionCallback } from "$lib/types";
import GameSettingsEditor from "./game-settings-editor.svelte";
import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";

export let gamestate: AuctionTTTViewpoint;
export let socketCallback: ActionCallback;

let clientSideGamestate = gamestate;

const actionCallback: ActionCallback = (action) => {
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

  socketCallback(action);
};
</script>

{#if gamestate.isHost}
  <RoomSettingsEditor gamestate={gamestate} changeRoomSettingsCallback={actionCallback} />
  <GameSettingsEditor gamestate={gamestate} changeGameSettingsCallback={actionCallback} />
{/if}
<InviteLink />