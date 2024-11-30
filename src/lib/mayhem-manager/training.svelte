<script lang="ts">
  import { lastAction } from "$lib/stores";
  import { equipment, ownTeam, ownTeamIndex, ready, teams } from "$lib/mayhem-manager/stores";
  import EquipmentInfo from "$lib/mayhem-manager/equipment-info.svelte";
  import FighterInfo from "$lib/mayhem-manager/fighter-info.svelte";
  import { StatName, type Equipment, type Fighter, type FighterStats } from "$lib/mayhem-manager/types";

  let equipmentBought: number[] = [];
  // if the user does not control a team, skills should be an empty array.
  // if they do control a team, intialize each fighter to train toughness
  let skills: (keyof FighterStats | number)[] = $ownTeamIndex === null ? [] :
      Array($ownTeam.fighters.length).fill("toughness");

  function pick(index: number) {
    equipmentBought.push(index);
    const e = $equipment.splice(index, 1)[0];
    teams.update(x => x.map((team, i) => {
      if (i !== $ownTeamIndex) {
        return team;
      }
      team.equipment.push(e);
      team.money -= e.price;
      return team;
    }));
    equipment.update(x => x);
  }

  // Submit the equipment you're buying and skills you're training
  function practice() {
    lastAction.set({
      type: "practice",
      equipment: equipmentBought,
      skills
    });

    // update the fighters' stats and attunements after training
    $ownTeam.fighters.forEach((f, i) => {
      if (typeof skills[i] === "number") {
        f.attunements.push($ownTeam.equipment[skills[i]]);
      } else {
        f.stats[skills[i]] += 1;
      }
    });
    teams.update(old => old);
  }

  // Filters out repeat equipment and already-attuned equipment
  function attunableEquipment(equipment: Equipment[], fighter: Fighter): Equipment[] {
    return [...new Set(equipment)].filter(e => !fighter.attunements.includes(e.name));
  }
</script>

{#if $ownTeamIndex !== null}
  <div class="column" style:flex=2>
    <h2 class="column-title">Equipment</h2>
    <div class="equipment">
      {#each $equipment as equipment, index}
        <EquipmentInfo {equipment} {index} callback={pick} />
      {/each}
    </div>
  </div>
  <div class="column" style:flex=1>
    <h2 class="column-title">Select training</h2>
    <div class="list-container">
      {#each $ownTeam.fighters as fighter, index}
        <div class="horiz text-and-buttons">
          <div class="show-child-on-hover">
            {fighter.name}
            <div class="show-on-hover">
              <FighterInfo {fighter} />
            </div>
          </div>
          <div class="right-align-outer">
            <select class="right-align-inner"
                bind:value={skills[index]}>
              <optgroup label="Improve a skill">
                {#each Object.values(StatName) as stat}
                  <option value={stat}>{stat}</option>
                {/each}
              </optgroup>
              <optgroup label="Attune to an equipment">
                {#each attunableEquipment($ownTeam.equipment, fighter) as equipment, index}
                  <option value={index}>{equipment.name}</option>
                {/each}
              </optgroup>
            </select>
          </div>
        </div>
      {/each}
    </div>

    <button class="ready"
        on:click={practice} on:submit={practice}>Ready!</button>

    <div>
      Waiting for:
      {
        $teams.map((team, i) => {
          return {
            name: team.name,
            unready: $teams[i].controller !== "bot" && !$ready[i]
          };
        }).filter(t => t.unready)
          .map(t => t.name)
          .join(", ")
      }
    </div>

    <h2>Your equipment</h2>

    <div class="list-container">
      {#each $ownTeam.equipment as equipment}
        <div class="show-child-on-hover">
          {equipment.name}
          <div class="show-on-hover">
            <EquipmentInfo {equipment} />
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .equipment {
    align-self: stretch;
    align-items: stretch;
  }

  select {
    min-width: auto;
  }

  .ready {
    margin: 0.75rem;
  }

  .list-container {
    margin-top: -0.5rem;
  }
</style>