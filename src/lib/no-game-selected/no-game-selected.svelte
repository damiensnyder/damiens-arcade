<script lang="ts">
import InviteLink from "$lib/invite-link.svelte";
import RoomSettingsEditor from "$lib/room-settings-editor.svelte";
import type { ActionCallback } from "$lib/types";
import type { NoneViewpoint } from "$lib/no-game-selected/types";

export let gamestate: NoneViewpoint;
export let socketCallback: ActionCallback;
</script>

{#if gamestate.isHost}
  <RoomSettingsEditor gamestate={gamestate} changeRoomSettingsCallback={socketCallback} />
{/if}
<InviteLink />