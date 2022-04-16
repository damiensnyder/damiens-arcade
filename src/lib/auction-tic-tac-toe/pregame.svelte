<script lang="ts">
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import InviteLink from "$lib/invite-link.svelte";
  import GameSettingsEditor from "$lib/auction-tic-tac-toe/game-settings-editor.svelte";
  import PlayerSelect from "$lib/auction-tic-tac-toe/player-select.svelte";
</script>
  
<h1>Damien's Arcade</h1>
<div class="top-level-menu">
  <div>
    <RoomSettingsEditor />
    <GameSettingsEditor />
    <InviteLink />
  </div>
  <PlayerSelect />
</div>

<style>
  .top-level-menu {
    flex-flow: row;
  }
</style>