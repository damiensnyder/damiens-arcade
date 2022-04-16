<script lang="ts">
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import InviteLink from "$lib/invite-link.svelte";
  import GameSettingsEditor from "./game-settings-editor.svelte";
  import PlayerSelect from "./player-select.svelte";
import EventLog from "./event-log.svelte";
</script>
  
<h1>Damien's Arcade</h1>
<div class="top-level-menu">
  <div>
    <RoomSettingsEditor />
    <GameSettingsEditor />
    <InviteLink />
  </div>
  <PlayerSelect />
  <EventLog />
</div>

<style>
  .top-level-menu {
    flex-flow: row;
  }
</style>