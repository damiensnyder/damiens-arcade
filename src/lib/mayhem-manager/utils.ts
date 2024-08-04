import { EquipmentSlot, type Bracket, type Equipment, type Fighter, type PreseasonTeam, type Team } from "$lib/mayhem-manager/types";

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

// TODO: Move all the other places I validate equipment to only validate here
export function isValidEquipment(equipment: Equipment[]) {
  let usedSlots: EquipmentSlot[] = [];
  for (const e of equipment) {
    usedSlots = usedSlots.concat(e.slots);
    if (usedSlots.filter(s => s === EquipmentSlot.Head).length > 1 ||
        usedSlots.filter(s => s === EquipmentSlot.Torso).length > 1 ||
        usedSlots.filter(s => s === EquipmentSlot.Hand).length > 2 ||
        usedSlots.filter(s => s === EquipmentSlot.Legs).length > 1 ||
        usedSlots.filter(s => s === EquipmentSlot.Feet).length > 1) {
      return false;
    }
  }
  return true;
}

export function nextMatch(bracket: Bracket): Bracket & {
  left: Bracket,
  right: Bracket
} {
  // @ts-ignore
  if (bracket.left === undefined) {
    return {
      left: { winner: -1 },
      right: { winner: -1 },
      winner: null
    };
  }
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

const STAT_VALUES = {
  strength: 0.01,
  accuracy: 0.01,
  energy: 0.01,
  speed: 0.01,
  toughness: 0.01
}
const FIGHTER_ABILITY_VALUES = {
  noAbilities: 0,
  extraDamageOnHit: 0.05,
  gainStrengthOnHitTaken: 0.01,
  powerfulFists: 0.02,
  shorterCooldowns: 0,
};
const EQUIPMENT_ABILITY_VALUES = {
  battleAxe: 0.08,
  bow: 0.01,
  cornDog: 0.07,
  devilHorns: 0.03,
  diamondSword: 0.09,
  fairyHat: 0.01,
  flamingoFloat: 0.11,
  frillySkirt: 0.38,
  fullSuitOfArmor: 0.04,
  jellyhat: 0.06,
  laserBlaster: 0.10,
  rhinocerosBeetleHorn: 0.01,
  rollerBlades: 0.13,
  shield: 0.03,
  shiv: 0.02,
  snowmanHead: 0.01,
  sportsJersey: 0.16,
  vikingHelmet: 0.01,
  wandOfFlames: 0.10,
  zapHelmet: 0.08,
}
const EQUIPMENT_ATTUNEMENT_VALUES = {
  battleAxe: 0,
  bow: 0.04,
  cornDog: 0,
  devilHorns: 0,
  diamondSword: 0.02,
  fairyHat: 0,
  flamingoFloaty: 0,
  frillySkirt: 0,
  fullSuitOfArmor: 0,
  jellyhat: 0,
  laserBlaster: 0.01,
  rhinocerosBeetleHorn: 0.04,
  rollerBlades: 0.02,
  shield: 0,
  shiv: 0.01,
  snowmanHead: 0,
  sportsJersey: 0.02,
  vikingHelmet: 0,
  wandOfFlames: 0.03,
  zapHelmet: 0.03,
}
const VALUE_TO_DOLLARS = 60;

export function fighterValue(fighter: Fighter): number {
  let value = FIGHTER_ABILITY_VALUES[fighter.abilityName];
  for (const stat in fighter.stats) {
    value += (fighter.stats[stat] + 1 - 0.2 * fighter.experience) * STAT_VALUES[stat];
  }
  return value * VALUE_TO_DOLLARS;
}

// not taking experience into account
export function fighterValueInBattle(fighter: Fighter, equipment: Equipment[]): number {
  let value = FIGHTER_ABILITY_VALUES[fighter.abilityName];
  for (const stat in fighter.stats) {
    value += fighter.stats[stat] * STAT_VALUES[stat];
  }
  for (const e of equipment) {
    value += EQUIPMENT_ABILITY_VALUES[e.abilityName];
    if (fighter.attunements.includes(e.name)) {
      value += EQUIPMENT_ATTUNEMENT_VALUES[e.abilityName];
    }
  }
  return value * VALUE_TO_DOLLARS;
}