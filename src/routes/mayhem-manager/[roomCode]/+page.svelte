<script lang="ts">
  import { page } from "$app/stores";
  import { connected, eventLog, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
  import { io } from "socket.io-client";
  import { eventHandler, handleGamestate } from "$lib/mayhem-manager/event-handler";
  import "../../../styles/global.css";
  import "../../../styles/fun.css";
  import type { MayhemManagerAction, MayhemManagerEvent, MayhemManagerViewpoint } from "$lib/mayhem-manager/types";
  import { bracket, draftOrder, equipment, fighters, gameStage, ownTeam, ownTeamIndex, spotInDraftOrder, teams, watchingFight } from "$lib/mayhem-manager/stores";
  import TeamView from "$lib/mayhem-manager/team-view.svelte";
  import AllTeams from "$lib/mayhem-manager/all-teams.svelte";
  import WatchFight from "$lib/mayhem-manager/watch-fight.svelte";
  import Preseason from "$lib/mayhem-manager/preseason.svelte";
  import FreeAgency from "$lib/mayhem-manager/free-agency.svelte";
  import Draft from "$lib/mayhem-manager/draft.svelte";
  import Training from "$lib/mayhem-manager/training.svelte";
  import PickBrFighter from "$lib/mayhem-manager/pick-br-fighter.svelte";
  import PickFighters from "$lib/mayhem-manager/pick-fighters.svelte";

  const relativeUrl = $page.url.pathname;
  const socket = io(relativeUrl);

  let checkForDisconnect;

  function handleDisconnect() {
    $connected = false
    $pov = -1;
    $lastAction = null;
    eventLog.append("You have disconnected from the game.");
    clearInterval(checkForDisconnect);
    socket.connect();
  }

  socket.on('connect', () => {
    $connected = true;
    eventLog.append("You have connected to the game.")

    checkForDisconnect = setInterval(function() {
      if (!socket.connected) {
        clearInterval(checkForDisconnect);
        handleDisconnect();
      }
    }, 5000)
  });

  socket.on('disconnect', handleDisconnect);

  socket.on('gamestate', (gamestate: MayhemManagerViewpoint) => {
    if (!gamestate) return;
    $roomCode = gamestate.roomCode;
    $roomName = gamestate.roomName;
    $isPublic = gamestate.isPublic;
    $host = gamestate.host;
    $pov = gamestate.pov;
    handleGamestate(gamestate);
    console.log(gamestate);
  });

  socket.on("event", (event: MayhemManagerEvent) => {
    console.log(event);

    // CHANGE ROOM SETTINGS
    if (event.type === "changeRoomSettings") {
      $isPublic = event.isPublic;
      $roomName = event.roomName;

      // CHANGE HOST
    } else if (event.type === "changeHost") {
      $host = event.host;
      if (event.host === $pov) {
        eventLog.append("The previous host has disconnected. You are now the host of this room.");
      }

    // HANDLE GAME-SPECIFIC EVENTS
    } else {
      // @ts-ignore
      eventHandler[event.type](event);
    }
  });

  // emit every action sent via this store to the server
  lastAction.subscribe((action: MayhemManagerAction) => {
    socket.emit('action', action);
    console.log($lastAction);
  });

  // midgame stuff

  let viewing: number | boolean = null;

  function changeView(team: number | boolean) {
    viewing = team;
  }

  function debug(): void {
    lastAction.set("debug");
    console.log({
      teams: $teams,
      equipment: $equipment,
      bracket: $bracket,
      fighters: $fighters,
      draftOrder: $draftOrder,
      spotInDraftOrder: $spotInDraftOrder,
      gameStage: $gameStage
    });
  }
</script>

<svelte:head>
  <title>Damien's Arcade | Mayhem Manager | {$roomName}</title>
</svelte:head>

<main>
  <div class="top-icons horiz">
    <h2>{$gameStage}</h2>
    <button on:click={debug} on:submit={debug}>Debug</button>
    <button on:click={() => changeView(-1)} on:submit={() => changeView(-1)}>Watch Fight</button>
    {#if $host === $pov}
      <button on:click={() => lastAction.set({ type: "advance" })}>Advance</button>
    {/if}
    {#if $ownTeamIndex !== null}
      <div class="money">${$ownTeam.money}</div>
      {#if viewing !== $ownTeamIndex}
        <button on:click={() => changeView($ownTeamIndex)} on:submit={() => changeView($ownTeamIndex)}>
          My Team
        </button>
      {/if}
    {/if}
    {#if viewing !== false}
      <button on:click={() => changeView(false)} on:submit={() => changeView(false)}>
        Back to {$gameStage}
      </button>
    {/if}
    <button on:click={() => changeView(true)} on:submit={() => changeView(true)}>
      All teams
    </button>
  </div>

  <div class="container horiz">
    {#if typeof viewing === "number" && viewing >= 0}
      <TeamView team={$teams[viewing]} />
    {:else if viewing === true}
      <AllTeams callback={changeView} />
    {:else if viewing === -1} <!-- previously was $fightersInBattle.length > 0 -->
      <WatchFight />
    {:else if $gameStage === "preseason"}
      <Preseason />
    {:else if $gameStage === "draft"}
      <Draft />
    {:else if $gameStage === "free agency"}
      <FreeAgency />
    {:else if $gameStage === "training"}
      <Training />
    {:else if $gameStage === "battle royale"}
      <PickBrFighter />
    {:else if $watchingFight}
      <WatchFight debug={false} />
    {:else}
      <PickFighters />
    {/if}
  </div>
</main>
  
<style>
  main {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    min-height: 100vh;
    justify-content: stretch;
    align-items: stretch;

    background-color: var(--bg-1);
    color: var(--text-1);
    font-family: var(--font-fun);
}

  .top-icons {
    justify-content: stretch;
    margin: 0 1.5rem;
  }

  .container {
    flex: 1;
    margin: 1rem 2rem 2rem 2rem;
    justify-content: space-evenly;
    align-items: stretch;
    background-color: var(--bg-3);
    border-radius: 1.5rem;
    border: 3px solid var(--bg-2);
  }

  h2 {
    margin: 0 0.5rem;
    flex: 1;
  }

  button {
    margin: 0 0.5rem;
  }

  .money {
    margin: 0 0.5rem;
    font-size: 1.2rem;
  }
</style>