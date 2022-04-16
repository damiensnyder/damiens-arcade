<script lang="ts">
  import InviteLink from "$lib/invite-link.svelte";
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import { roomName } from "$lib/stores";
</script>

<svelte:head>
  <title>Damien's Arcade | {$roomName}</title>
</svelte:head>

<h1>Damien's Arcade</h1>
<div class="top-level-menu">
  <RoomSettingsEditor />
  <InviteLink />
</div>