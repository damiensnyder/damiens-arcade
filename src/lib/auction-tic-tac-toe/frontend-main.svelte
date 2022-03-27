<script lang="ts">
import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
import InviteLink from "$lib/invite-link.svelte";
import type { ActionCallback } from "$lib/types";
import GameSettingsEditor from "./game-settings-editor.svelte";
import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";

export let gamestate: AuctionTTTViewpoint;
export let socketCallback: ActionCallback;

const actionCallback: ActionCallback = (action) => {
  socketCallback(action);
};
</script>

{#if gamestate.isHost}
  <RoomSettingsEditor gamestate={gamestate} changeRoomSettingsCallback={actionCallback} />
{/if}
<GameSettingsEditor gamestate={gamestate} changeGameSettingsCallback={actionCallback} />
<InviteLink />