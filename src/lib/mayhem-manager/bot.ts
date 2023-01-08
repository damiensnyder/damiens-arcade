import { StatName, type Strategy } from "$lib/mayhem-manager/types";
import type { Equipment, Fighter, PreseasonTeam, Team } from "$lib/mayhem-manager/types";

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
  getBRPicks: function (_team: Team): {
    fighter: number
    equipment: number[]
  } {
    return {
      fighter: 0,
      equipment: [0]
    };
  },
  getFightPicks: function (team: Team): {
    equipment: number[][]
    strategy: Strategy[]
  } {
    return {
      equipment: team.fighters.map((_, i) => [i]),
      strategy: team.fighters.map(_ => { return {}; })
    };
  }
};

export default Bot;