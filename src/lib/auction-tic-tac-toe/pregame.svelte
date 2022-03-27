<script lang="ts">
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import InviteLink from "$lib/invite-link.svelte";
  import type { ActionCallback } from "$lib/types";
  import GameSettingsEditor from "./game-settings-editor.svelte";
  import type { PregameViewpoint } from "$lib/auction-tic-tac-toe/types";
  import PlayerSelect from "./player-select.svelte";
  
  export let gamestate: PregameViewpoint;
  export let callback: ActionCallback;
  
  const actionCallback: ActionCallback = (action) => {
    callback(action);
  };
</script>
  
<div class="top-level-menu">
  <div>
    <RoomSettingsEditor gamestate={gamestate} callback={actionCallback} />
    <GameSettingsEditor gamestate={gamestate} callback={actionCallback} />
    <InviteLink />
  </div>
  <PlayerSelect gamestate={gamestate} callback={actionCallback} />
</div>

<style>
  .top-level-menu {
    flex-flow: row;
  }
</style>