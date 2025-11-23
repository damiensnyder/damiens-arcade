<script lang="ts">
	import { page } from '$app/stores';
	import { dev } from '$app/environment';
	import type {
		MayhemManagerAction,
		MayhemManagerEvent,
		MayhemManagerViewpoint
	} from '$lib/shared/mayhem-manager/types';
	import { eventHandler, handleGamestate } from '$lib/client/mayhem-manager/event-handler';
	import { gameStore } from '$lib/client/mayhem-manager/stores.svelte';
	import { commonStore } from '$lib/client/stores.svelte';
	import TeamView from '$lib/client/mayhem-manager/team-view.svelte';
	import AllTeams from '$lib/client/mayhem-manager/all-teams.svelte';
	import WatchFight from '$lib/client/mayhem-manager/watch-fight.svelte';
	import Preseason from '$lib/client/mayhem-manager/preseason.svelte';
	import FreeAgency from '$lib/client/mayhem-manager/free-agency.svelte';
	import Draft from '$lib/client/mayhem-manager/draft.svelte';
	import Training from '$lib/client/mayhem-manager/training.svelte';
	import PickBrFighter from '$lib/client/mayhem-manager/pick-br-fighter.svelte';
	import Tournament from '$lib/client/mayhem-manager/tournament.svelte';
	import SettingsEditor from '$lib/client/mayhem-manager/settings-editor.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	const roomCode = data.roomCode;

	let ws: WebSocket | null = $state(null);
	let alreadySentInPicks = $state(false);
	let viewing: number | 'allTeams' | 'main' | 'settings' | 'watchFight' = $state('main');

	function changeView(newView: number | 'allTeams' | 'main' | 'settings' | 'watchFight') {
		return () => {
			viewing = newView;
		};
	}

	const absoluteUrl = $page.url.toString();
	function copyInvite(): void {
		navigator.clipboard.writeText(absoluteUrl);
	}

	function debug(): void {
		commonStore.sendAction('debug');
		console.log({
			teams: gameStore.teams,
			equipment: gameStore.equipment,
			bracket: gameStore.bracket,
			fighters: gameStore.fighters,
			draftOrder: gameStore.draftOrder,
			spotInDraftOrder: gameStore.spotInDraftOrder,
			gameStage: gameStore.gameStage
		});
	}

	// if in next fight or if last fight was championship, just stop watching. else advance
	function advance(): void {
		const nextMatch = gameStore.getNextMatch();
		const ownTeamIndex = gameStore.getOwnTeamIndex(commonStore.pov);

		if (
			gameStore.gameStage === 'tournament' &&
			gameStore.watchingFight &&
			(gameStore.bracket.winner !== null ||
				nextMatch.left.winner === ownTeamIndex ||
				nextMatch.right.winner === ownTeamIndex)
		) {
			gameStore.watchingFight = false;
		} else if (
			gameStore.gameStage === 'tournament' &&
			!gameStore.watchingFight &&
			(nextMatch.left.winner === ownTeamIndex || nextMatch.right.winner === ownTeamIndex) &&
			!gameStore.equipmentChoices.every((ec) => ec === -1) &&
			!alreadySentInPicks
		) {
			// if you've already picked equipment in the tournament, interpret advance as "ready"
			const ownTeam = gameStore.getOwnTeam(commonStore.pov);
			if (ownTeam) {
				commonStore.sendAction({
					type: 'pickFighters',
					equipment: ownTeam.fighters.map((_, i) =>
						gameStore.equipmentChoices.map((ec, j) => (ec === i ? j : -1)).filter((ec) => ec >= 0)
					)
				});
				alreadySentInPicks = true;
			}
		} else {
			commonStore.sendAction({ type: 'advance' });
		}
	}

	onMount(() => {
		const wsUrl = dev
			? `ws://localhost:3000/ws/mayhem-manager/${roomCode}`
			: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/mayhem-manager/${roomCode}`;
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			commonStore.connected = true;
			commonStore.appendEventLog('You have connected to the game.');
		};

		ws.onmessage = (event) => {
			const message = JSON.parse(event.data);

			if (message.type === 'gamestate') {
				const gamestate = message.data as MayhemManagerViewpoint;
				commonStore.roomCode = gamestate.roomCode;
				commonStore.roomName = gamestate.roomName;
				commonStore.isPublic = gamestate.isPublic;
				commonStore.host = gamestate.host;
				commonStore.pov = gamestate.pov;
				handleGamestate(gamestate, commonStore.pov);
			} else if (message.type === 'event') {
				const gameEvent = message.event as MayhemManagerEvent;
				alreadySentInPicks = false;

				// Handle common events
				if (gameEvent.type === 'changeRoomSettings') {
					commonStore.roomName = gameEvent.roomName;
					commonStore.isPublic = gameEvent.isPublic;
				} else if (gameEvent.type === 'changeHost') {
					commonStore.host = gameEvent.host;
					if (gameEvent.host === commonStore.pov) {
						commonStore.appendEventLog(
							'The previous host has disconnected. You are now the host of this room.'
						);
					}
				} else {
					// Handle game-specific events
					eventHandler[gameEvent.type](gameEvent);

					// if you replace a team and you were viewing all teams, change view to main
					if (gameEvent.type === 'replace' && gameEvent.controller === commonStore.pov && viewing === 'allTeams') {
						changeView('main')();
					}
				}
			}
		};

		ws.onclose = () => {
			commonStore.connected = false;
			commonStore.pov = -1;
			commonStore.appendEventLog('You have disconnected from the game.');
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		// Set up the sendAction function
		commonStore.sendAction = (action: MayhemManagerAction | string) => {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: 'action', action }));
			}
		};

		return () => {
			if (ws) {
				ws.close();
			}
		};
	});

	let ownTeamIndex = $derived(gameStore.getOwnTeamIndex(commonStore.pov));
	let ownTeam = $derived(gameStore.getOwnTeam(commonStore.pov));
</script>

<svelte:head>
	<title>Damien's Arcade | Mayhem Manager | {commonStore.roomName}</title>
</svelte:head>

<div class="page-outer">
	<div class="top-icons horiz">
		<h2>{gameStore.gameStage}</h2>
		{#if ownTeamIndex !== null && ownTeam}
			<div class="money">${ownTeam.money}</div>
		{/if}
		<button onclick={copyInvite} onsubmit={copyInvite}>copy invite</button>
		{#if dev}
			<button onclick={debug} onsubmit={debug}>debug</button>
			<button onclick={changeView('watchFight')} onsubmit={changeView('watchFight')}>
				watch fight
			</button>
		{/if}
		{#if commonStore.host === commonStore.pov}
			<button onclick={changeView('settings')} onsubmit={changeView('settings')}>settings</button>
			<button onclick={advance} onsubmit={advance}>skip</button>
		{/if}
		{#if viewing !== 'main'}
			<button onclick={changeView('main')} onsubmit={changeView('main')}>
				back to {gameStore.gameStage}
			</button>
		{/if}
		{#if ownTeamIndex !== null}
			{#if viewing !== ownTeamIndex}
				<button onclick={changeView(ownTeamIndex)} onsubmit={changeView(ownTeamIndex)}>
					my team
				</button>
			{/if}
		{/if}
		{#if viewing !== 'allTeams'}
			<button onclick={changeView('allTeams')} onsubmit={changeView('allTeams')}>
				all teams
			</button>
		{/if}
	</div>

	<main class="horiz">
		{#if typeof viewing === 'number'}
			<TeamView team={gameStore.teams[viewing]} />
		{:else if viewing === 'allTeams'}
			<AllTeams callback={changeView} />
		{:else if viewing === 'watchFight'}
			<WatchFight debug={true} />
		{:else if viewing === 'settings'}
			<SettingsEditor />
		{:else if gameStore.gameStage === 'preseason'}
			<Preseason />
		{:else if gameStore.gameStage === 'draft'}
			<Draft />
		{:else if gameStore.gameStage === 'free agency'}
			<FreeAgency />
		{:else if gameStore.gameStage === 'training'}
			<Training />
		{:else if gameStore.gameStage === 'battle royale'}
			<PickBrFighter />
		{:else if gameStore.watchingFight}
			<WatchFight />
		{:else}
			<Tournament />
		{/if}
	</main>
</div>

<style>
	.page-outer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-flow: column;
		justify-content: stretch;
		align-items: stretch;
		overflow: hidden;

		background-color: var(--bg-1);
		color: var(--text-1);
		font-family: var(--font-fun);
	}

	.top-icons {
		justify-content: stretch;
		margin: 0.25rem 1rem;
		overflow-x: scroll;
	}

	.top-icons button {
		white-space: nowrap;
		margin: 0 0.5rem;
	}

	main {
		flex: 1;
		margin: 0 1.5rem 1.5rem 1.5rem;
		justify-content: space-evenly;
		align-items: stretch;
		overflow: hidden;

		background-color: var(--bg-3);
		border-radius: 1.5rem;
		border: 3px solid var(--bg-2);
	}

	h2 {
		margin: 0 0.5rem;
		flex: 1;
	}

	.money {
		margin: 0 0.5rem;
		font-size: 1.2rem;
	}

	@media only screen and (max-width: 720px) {
		main {
			margin: 0 0.5rem 0.5rem 0.5rem;
		}

		.top-icons {
			margin: 0.25rem 0;
		}

		.top-icons button {
			margin: 0 0.25rem;
		}
	}

	@media only screen and (min-width: 720px) and (max-width: 1200px) {
		main {
			margin: 0 0.75rem 0.75rem 0.75rem;
		}

		.top-icons {
			margin: 0.25rem 0.4rem;
		}

		.top-icons button {
			margin: 0 0.25rem;
		}
	}
</style>
