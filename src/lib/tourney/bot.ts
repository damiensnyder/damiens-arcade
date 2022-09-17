// @ts-ignore
import { StatName } from "$lib/tourney/types";
import type { Equipment, Fighter, PreseasonTeam, Team } from "$lib/tourney/types";

const Bot = {
  getPreseasonPicks: function (team: PreseasonTeam): {
    fighters: number[]
    equipment: number[]
  } {
    return {
      fighters: [],
      equipment: []
    };
  },
  getDraftPick: function (team: Team, fighters: Fighter[]): number {
    return 0;
  },
  getFAPicks: function (team: Team, fighters: Fighter[]): number[] {
    return [];
  },
  getTrainingPicks: function (team: Team, equipment: Equipment[]): {
    equipment: number[]
    skills: (number | StatName)[]
  } {
    return {
      equipment: [],
      skills: []
    };
  },
  getBRPicks: function (team: Team): {
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
    strategy: number[]
  } {
    return {
      equipment: [],
      strategy: []
    };
  }
};

export default Bot;