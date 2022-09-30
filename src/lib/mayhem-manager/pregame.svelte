<script lang="ts">
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import InviteLink from "$lib/invite-link.svelte";
  import GameSettingsEditor from "$lib/mayhem-manager/game-settings-editor.svelte";
</script>
  
<h1>Damien's Arcade</h1>
<div class="top-level-menu">
  <RoomSettingsEditor />
  <GameSettingsEditor />
  <InviteLink />
</div>