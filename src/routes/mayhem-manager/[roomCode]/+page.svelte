<script lang="ts">
  import { page } from "$app/stores";
  import { connected, eventLog, host, isPublic, lastAction, pov, roomCode, roomName } from "$lib/stores";
  import { io } from "socket.io-client";
  import { dev } from "$app/environment";
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
  import SettingsEditor from "$lib/mayhem-manager/settings-editor.svelte";

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

      // if you replace a team and you were viewing all teams, change view to main
      if (event.type === "replace" && event.controller === $pov && viewing === "allTeams") {
        changeView("main");
      }
    }
  });

  // emit every action sent via this store to the server
  lastAction.subscribe((action: MayhemManagerAction) => {
    socket.emit('action', action);
    console.log($lastAction);
  });

  // midgame stuff

  let viewing: number | "allTeams" | "main" | "settings" | "watchFight" = "main";

  function changeView(newView: number | "allTeams" | "main" | "settings" | "watchFight") {
    viewing = newView;
  }
  
  const absoluteUrl = $page.url.toString();
  function copyInvite(): void {
    navigator.clipboard.writeText(absoluteUrl);
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
    {#if $ownTeamIndex !== null}
      <div class="money">${$ownTeam.money}</div>
    {/if}
    <button on:click={copyInvite} on:submit={copyInvite}>copy invite</button>
    {#if dev}
      <button on:click={debug} on:submit={debug}>debug</button>
      <button on:click={() => changeView("watchFight")} on:submit={() => changeView("watchFight")}>
        watch fight
      </button>
    {/if}
    {#if $host === $pov}
      <button on:click={() => changeView("settings")} on:submit={() => changeView("settings")}>settings</button>
      <button on:click={() => lastAction.set({ type: "advance" })} on:submit={() => lastAction.set({ type: "advance" })}>advance</button>
    {/if}
    {#if viewing !== "main"}
      <button on:click={() => changeView("main")} on:submit={() => changeView("main")}>
        back to {$gameStage}
      </button>
    {/if}
    {#if $ownTeamIndex !== null}
      {#if viewing !== $ownTeamIndex}
        <button on:click={() => changeView($ownTeamIndex)} on:submit={() => changeView($ownTeamIndex)}>
          my team
        </button>
      {/if}
    {/if}
    {#if viewing !== "allTeams"}
      <button on:click={() => changeView("allTeams")} on:submit={() => changeView("allTeams")}>
        all teams
      </button>
    {/if}
  </div>

  <div class="container horiz">
    {#if typeof viewing === "number"}
      <TeamView team={$teams[viewing]} />
    {:else if viewing === "allTeams"}
      <AllTeams callback={changeView} />
    {:else if viewing === "watchFight"}
      <WatchFight debug={true} />
    {:else if viewing === "settings"}
      <SettingsEditor />
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
      <WatchFight />
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
    bottom: 0;
    display: flex;
    flex-flow: column;
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