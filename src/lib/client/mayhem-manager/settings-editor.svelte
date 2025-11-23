<script lang="ts">
	import RoomSettingsEditor from '../room-settings-editor.svelte';
	import type { MayhemManagerExport } from '$lib/shared/mayhem-manager/types';
	import * as gameStore from './stores.svelte';
	import * as commonStore from '../stores.svelte';
	import { onMount } from 'svelte';

	let leagueImportRaw = $state('');
	let firstUpdate = $state(true);

	// Watch for league export changes
	$effect(() => {
		const currentExport = gameStore.leagueExport;
		if (firstUpdate) {
			firstUpdate = false;
		} else if (currentExport && Object.keys(currentExport).length > 0) {
			downloadLeagueExport(currentExport);
		}
	});

	function exportLeague() {
		commonStore.sendAction({
			type: 'export'
		});
	}

	function downloadLeagueExport(newExport: MayhemManagerExport) {
		const a = document.createElement('a');
		const blob = new Blob([JSON.stringify(newExport)]);
		const url = URL.createObjectURL(blob);
		a.setAttribute('href', url);
		a.setAttribute('download', `mayhem-manager-${commonStore.roomName}.json`);
		a.click();
	}

	function importLeague() {
		commonStore.sendAction({
			type: 'import',
			...JSON.parse(leagueImportRaw)
		});
	}
</script>

<div>
	<RoomSettingsEditor />
</div>

<div>
	<h3>Export league to file:</h3>
	<button onclick={exportLeague} onsubmit={exportLeague}>export</button>
	<h3>Import league:</h3>
	{#if commonStore.host === commonStore.pov}
		<textarea
			name="league-import"
			bind:value={leagueImportRaw}
			placeholder={'(paste contents of league file here)'}
		></textarea>
		<div class="horiz">
			<button onclick={importLeague} onsubmit={importLeague} disabled={leagueImportRaw.length === 0}>
				import
			</button>
		</div>
	{/if}
</div>

<style>
	.horiz {
		justify-content: space-between;
	}

	button {
		margin-top: 0.5rem;
	}
</style>
