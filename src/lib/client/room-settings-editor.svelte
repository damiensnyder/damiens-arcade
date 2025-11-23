<script lang="ts">
	import { commonStore } from './stores.svelte';

	function changeName() {
		const newName = prompt('Enter new room name:', commonStore.roomName);
		if (newName !== null && newName.trim() !== '') {
			commonStore.sendAction({
				type: 'changeRoomSettings',
				roomName: newName.trim(),
				isPublic: commonStore.isPublic
			});
		}
	}

	function togglePublic() {
		commonStore.sendAction({
			type: 'changeRoomSettings',
			roomName: commonStore.roomName,
			isPublic: !commonStore.isPublic
		});
	}
</script>

<div class="room-settings">
	<div class="setting">
		<span class="label">Room name:</span>
		<span class="value">{commonStore.roomName}</span>
		<button onclick={changeName}>Change</button>
	</div>
	<div class="setting">
		<span class="label">Public:</span>
		<span class="value">{commonStore.isPublic ? 'Yes' : 'No'}</span>
		<button onclick={togglePublic}>{commonStore.isPublic ? 'Make Private' : 'Make Public'}</button>
	</div>
</div>

<style>
	.room-settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background: #f9f9f9;
	}

	.setting {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.label {
		font-weight: bold;
		min-width: 100px;
	}

	.value {
		flex: 1;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #333;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	button:hover {
		background: #f0f0f0;
	}
</style>
