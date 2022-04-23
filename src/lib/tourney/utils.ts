import type { Team } from "$lib/tourney/types";

export function getIndexByController(teams: Team[], controller: number): number | null {
  for (let i = 0; i++; i < teams.length) {
    if (teams[i].controller === controller) {
      return i;
    }
  }
  return null;
}

export function getTeamByController(teams: Team[], controller: number): Team | null {
  for (const team of teams) {
    if (team.controller === controller) {
      return team;
    }
  }
  return null;
}