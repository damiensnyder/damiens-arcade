import { StatName, type Strategy } from "$lib/mayhem-manager/types";
import type { Equipment, Fighter, PreseasonTeam, Team } from "$lib/mayhem-manager/types";

const Bot = {
  getPreseasonPicks: function (_team: PreseasonTeam): {
    fighters: number[]
    equipment: number[]
  } {
    return {
      fighters: [],
      equipment: []
    };
  },
  getDraftPick: function (_team: Team, _fighters: Fighter[]): number {
    return 0;
  },
  getFAPicks: function (_team: Team, _fighters: Fighter[]): number[] {
    return [];
  },
  getTrainingPicks: function (team: Team, _equipment: Equipment[]): {
    equipment: number[]
    skills: (number | StatName)[]
  } {
    return {
      equipment: [],
      skills: team.fighters.map((_f) => StatName.Strength)
    };
  },
  getBRPicks: function (_team: Team): {
    fighter: number
    equipment: number[]
  } {
    return {
      fighter: 0,
      equipment: []
    };
  },
  getFightPicks: function (team: Team): {
    equipment: number[][]
    strategy: Strategy[]
  } {
    return {
      equipment: team.fighters.map(_ => []),
      strategy: team.fighters.map(_ => { return {}; })
    };
  }
};

export default Bot;