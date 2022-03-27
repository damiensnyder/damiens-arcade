<script lang="ts">
  import InviteLink from "$lib/invite-link.svelte";
  import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
  import type { ActionCallback } from "$lib/types";
  import type { NoneViewpoint } from "$lib/no-game-selected/types";
  
  export let gamestate: NoneViewpoint;
  export let callback: ActionCallback;
</script>

<h1>Damien's Arcade</h1>
<div class="top-level-menu">
  <RoomSettingsEditor gamestate={gamestate} callback={callback} />
  <InviteLink />
</div>