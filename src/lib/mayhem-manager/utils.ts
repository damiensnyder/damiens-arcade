import type { Bracket, EquipmentSlot, PreseasonTeam, Team } from "$lib/mayhem-manager/types";

export function getIndexByController(teams: Team[], controller: number): number | null {
  if (teams === undefined) return null;
  for (let i = 0; i < teams.length; i++) {
    if (teams[i].controller === controller) {
      return i;
    }
  }
  return null;
}

export function getTeamByController(teams: Team[] | PreseasonTeam[], controller: number): Team | PreseasonTeam | null {
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

export function nextMatch(bracket: Bracket): Bracket & {
  left: Bracket,
  right: Bracket
} {
  let nextMatch: Bracket & {
    left: Bracket,
    right: Bracket
  };
  const matchesToCheck: Bracket[] = [bracket];
  while (matchesToCheck.length > 0) {
    const match = matchesToCheck.shift();
    if (match.winner === null) {
      // @ts-ignore
      nextMatch = match;
      matchesToCheck.push(nextMatch.right);
      matchesToCheck.push(nextMatch.left);
    }
  }
  return nextMatch;
}