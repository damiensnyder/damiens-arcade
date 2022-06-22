<script lang="ts">
  import { fightersInBattle, gameStage, ownTeam, ownTeamIndex } from "$lib/tourney/stores";
  import Preseason from "$lib/tourney/preseason.svelte";
  import Draft from "$lib/tourney/draft.svelte";
  import Training from "$lib/tourney/training.svelte";
  import WatchFight from "$lib/tourney/watch-fight.svelte";
  import PickBrFighter from "$lib/tourney/pick-br-fighter.svelte";
  import PickFighters from "$lib/tourney/pick-fighters.svelte";
  import FreeAgency from "$lib/tourney/free-agency.svelte";
  import TeamView from "$lib/tourney/team-view.svelte";

  let onTeamView = false;

  function goToTeamView() {
    onTeamView = true;
  }

  function leaveTeamView() {
    onTeamView = false;
  }
</script>

<div class="fun">
  <div class="top-icons horiz">
    <h2>{$gameStage}</h2>
    {#if $ownTeamIndex !== null}
      <div class="money">${$ownTeam.money}</div>
      {#if onTeamView}
        <button on:click={leaveTeamView} on:submit={leaveTeamView}>Back to {$gameStage}</button>
      {:else}
        <button on:click={goToTeamView} on:submit={goToTeamView}>My Team</button>
      {/if}
    {/if}
    <button>All teams</button>
  </div>
  
  <div class="container horiz">
    {#if onTeamView}
      <TeamView team={$ownTeam} />
    {:else if $gameStage === "preseason"}
      <Preseason />
    {:else if $gameStage === "draft"}
      <Draft />
    {:else if $gameStage === "free agency"}
      <FreeAgency />
    {:else if $gameStage === "training"}
      <Training />
    {:else if $fightersInBattle.length > 0}
      <WatchFight />
    {:else if $gameStage === "battle royale"}
      <PickBrFighter />
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