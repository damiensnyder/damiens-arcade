import { StatName } from "$lib/tourney/types";
import type { Equipment, Fighter, PreseasonTeam, Team } from "$lib/tourney/types";

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
  getFightPicks: function (_team: Team): {
    equipment: number[][]
    strategy: number[]
  } {
    return {
      equipment: [],
      strategy: []
    };
  }
};

export default Bot;