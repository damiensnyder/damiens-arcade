<script lang="ts">
  import { bracket, draftOrder, equipment, fighters, gameStage, ownTeam, ownTeamIndex, spotInDraftOrder, teams, watchingFight } from "$lib/tourney/stores";
  import Preseason from "$lib/tourney/preseason.svelte";
  import Draft from "$lib/tourney/draft.svelte";
  import Training from "$lib/tourney/training.svelte";
  import WatchFight from "$lib/tourney/watch-fight.svelte";
  import PickBrFighter from "$lib/tourney/pick-br-fighter.svelte";
  import PickFighters from "$lib/tourney/pick-fighters.svelte";
  import FreeAgency from "$lib/tourney/free-agency.svelte";
  import TeamView from "$lib/tourney/team-view.svelte";
  import AllTeams from "$lib/tourney/all-teams.svelte";
  import { host, lastAction, pov } from "$lib/stores";

  // true for all teams, false for none, number for specific team. janky but who cares
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

<div class="fun">
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
</div>
  
<style>
  .top-icons {
    justify-content: stretch;
    margin: 0 1.5rem;
  }

  .container {
    flex: 1;
    margin: 1rem 2rem 2rem 2rem;
    justify-content: space-evenly;
    align-items: stretch;
    background-color: var(--bg-fun-3);
    border-radius: 1.5rem;
    border: 3px solid var(--bg-fun-2);
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