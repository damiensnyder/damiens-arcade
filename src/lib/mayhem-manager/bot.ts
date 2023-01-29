import { StatName, type Strategy } from "$lib/mayhem-manager/types";
import type { Equipment, Fighter, PreseasonTeam, Team } from "$lib/mayhem-manager/types";
import { isValidEquipmentBR, isValidEquipmentTournament } from "./battle-logic";

const Bot = {
  getPreseasonPicks: function (team: PreseasonTeam): {
    fighters: number[]
    equipment: number[]
  } {
    return {
      fighters: team.fighters.length >= 1 ? [0] : [],
      equipment: team.fighters.length >= 1 ? [1] : []
    };
  },
  getDraftPick: function (_team: Team, fighters: Fighter[]): number {
    // pick the fighter with the highest sum of stats
    let best = 0;
    for (let i = 1; i < fighters.length; i++) {
      let statSum = 0;
      let bestStatSum = 0;
      for (const stat in fighters[i].stats) {
        statSum += fighters[i].stats[stat];
      }
      for (const stat in fighters[best].stats) {
        bestStatSum += fighters[best].stats[stat];
      }
      if (statSum > bestStatSum) {
        best = i;
      }
    }

    return best;
  },
  getFAPicks: function (_team: Team, _fighters: Fighter[]): number[] {
    return [0];
  },
  getTrainingPicks: function (team: Team, _equipment: Equipment[]): {
    equipment: number[]
    skills: (number | StatName)[]
  } {
    return {
      equipment: [0, 1],
      skills: team.fighters.map((_f) => StatName.Strength)
    };
  },
  getBRPicks: function (team: Team): {
    fighter: number
    equipment: number[]
  } {
    const equipment = [];
    // try adding each piece of equipment, and remove any that aren't allowed
    for (let i = 0; i < team.equipment.length; i++) {
      equipment.push(i);
      if (!isValidEquipmentBR(team, equipment)) {
        equipment.pop();
      }
    }
    return {
      fighter: 0,
      equipment
    };
  },
  getFightPicks: function (team: Team): {
    equipment: number[][]
    strategy: Strategy[]
  } {
    const equipment = team.fighters.map(_ => []);
    // try adding each piece of equipment to each fighter, and remove any that aren't allowed
    for (let i = 0; i < team.fighters.length; i++) {
      for (let j = 0; j < team.equipment.length; j++) {
        equipment[i].push(j);
        if (!isValidEquipmentTournament(team, equipment)) {
          equipment[i].pop();
        }
      }
    }
    return {
      equipment,
      strategy: team.fighters.map(_ => { return {}; })
    };
  }
};

export default Bot;