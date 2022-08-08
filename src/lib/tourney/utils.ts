import type { EquipmentSlot, Team } from "$lib/tourney/types";

export function getIndexByController(teams: Team[], controller: number): number | null {
  if (teams === undefined) return null;
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].controller === controller) {
      return i;
    }
  }
  return null;
}

export function getTeamByController(teams: Team[], controller: number): Team | null {
  if (teams === undefined) return null;
  for (const team of teams) {
    if (team.controller === controller) {
      return team;
    }
  }
  return null;
}

export function slotsToString(slots: EquipmentSlot[]): string {
  let joined = slots.join(", ");
  if (joined === "") return "none";
  if (joined === "hand, hand") return "two-handed";
  return joined;
}