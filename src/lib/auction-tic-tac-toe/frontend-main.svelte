<script lang="ts">
import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
import InviteLink from "$lib/invite-link.svelte";
import type { ActionCallback } from "$lib/types";
import GameSettingsEditor from "./game-settings-editor.svelte";
import type { AuctionTTTViewpoint } from "$lib/auction-tic-tac-toe/types";
import PlayerSelect from "./player-select.svelte";

export let gamestate: AuctionTTTViewpoint;
export let socketCallback: ActionCallback;

const actionCallback: ActionCallback = (action) => {
  socketCallback(action);
};
</script>

<h1>Damien's Arcade</h1>
<div class="top-level-menu">
  <div>
    <RoomSettingsEditor gamestate={gamestate} changeRoomSettingsCallback={actionCallback} />
    <GameSettingsEditor gamestate={gamestate} changeGameSettingsCallback={actionCallback} />
    <InviteLink />
  </div>
  <PlayerSelect gamestate={gamestate} callback={actionCallback} />
</div>

<style>
  .top-level-menu {
    flex-flow: row;
  }
</style>