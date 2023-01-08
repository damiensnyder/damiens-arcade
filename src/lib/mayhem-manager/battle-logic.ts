import { array, boolean, number, object, string } from "yup";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { EquipmentSlot, type Equipment, type EquipmentDeck, type FighterDeck, type FighterInBattle, type FighterNames, type FighterTemplate, type Map, type MapDeck, type MidFightEvent, type Settings, type Team, type MayhemManagerEvent, type MeleeAttackAbility, StatName } from "$lib/mayhem-manager/types";
import type { Socket } from "socket.io";
import type { RNG } from "$lib/types";

const fighterStatsSchema = array(
  number().min(0).max(10).integer()
).length(6);

const ability = object({
  type: string().required().oneOf(["meleeAttack", "statChange"]),
  damage: number().when("type", {
    is: "meleeAttack",
    then: number().required().integer(),
    otherwise: undefined
  }),
  stat: string().when("type", {
    is: "statChange",
    then: string().required().oneOf(Object.values(StatName)),
    otherwise: undefined
  }),
  amount: string().when("type", {
    is: "statChange",
    then: number().required().integer(),
    otherwise: undefined
  })
});

const DECK_FILEPATH_BASE = "src/lib/mayhem-manager/data/";
export const TICK_LENGTH = 0.2;  // length of a tick in seconds

const fighterNames: FighterNames =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters/names.json").toString());
const fighterDecks: Record<string, FighterDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "fighters").forEach((fileName) => {
  fighterDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters/" + fileName).toString()).abilities;
});
const equipmentDecks: Record<string, EquipmentDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "equipment").forEach((fileName) => {
  equipmentDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "equipment/" + fileName).toString());
});
const mapDecks: Record<string, MapDeck> = {};
readdirSync(DECK_FILEPATH_BASE + "maps").forEach((fileName) => {
  mapDecks[fileName.split(".")[0]] =
      JSON.parse(readFileSync(DECK_FILEPATH_BASE + "maps/" + fileName).toString());
});

const fighterTemplateSchema = object({
  imgUrl: string().max(300),
  abilities: array(ability).required(),
  price: number().min(0).max(100).integer().required(),
  description: string().max(300),
  flavor: string().max(300)
});

const equipmentTemplateSchema = object({
  name: string().required().min(1).max(100),
  imgUrl: string().max(300).required(),
  slots: array(string().oneOf(Object.values(EquipmentSlot))).required(),
  abilities: array(ability).required(),
  price: number().min(0).max(100).integer().required(),
  description: string().max(300),
  flavor: string().max(300)
});

const mapFeatureSchema = object();

const mapSchema = object({
  name: string().required().min(1).max(100),
  imgUrl: string().required().min(1).max(300),
  features: array(mapFeatureSchema).required()
});

const settingsSchema = object({
  fighterDecks: array(string().min(0).max(100)).required(),
  equipmentDecks: array(string().min(0).max(100)).required(),
  mapDecks: array(string().min(0).max(100)).required(),
  customFighters: array(fighterTemplateSchema).required(),
  customEquipment: array(equipmentTemplateSchema).required(),
  customMaps: array(mapSchema).required()
});

const changeGameSettingsSchema = object({
  type: string().required().equals(["changeGameSettings"]),
  settings: settingsSchema.required()
});

export function settingsAreValid(settings: unknown): boolean {
  return changeGameSettingsSchema.isValidSync(settings);
}

// Merge all the decks of settings into a single deck
export function collatedSettings(settings: Settings): {
  fighters: FighterDeck,
  equipment: EquipmentDeck,
  maps: MapDeck
} {
  // create empty decks
  const fighterDeck: FighterDeck = {
    abilities: settings.customFighters,
    ...fighterNames
  }
  const equipmentDeck: EquipmentDeck = {
    equipment: settings.customEquipment
  }
  const mapDeck: MapDeck = {
    maps: settings.customMaps
  }

  for (const deck of settings.fighterDecks.map(deckName => fighterDecks[deckName])
      .filter(deck => deck !== undefined)) {
    fighterDeck.abilities = fighterDeck.abilities.concat(deck.abilities);
  }
  for (const deck of settings.equipmentDecks.map(deckName => equipmentDecks[deckName])
      .filter(deck => deck !== undefined)) {
    equipmentDeck.equipment = equipmentDeck.equipment.concat(deck.equipment);
  }
  for (const deck of settings.mapDecks.map(deckName => mapDecks[deckName])
      .filter(deck => deck !== undefined)) {
    mapDeck.maps = mapDeck.maps.concat(deck.maps);
  }

  // Add defaults to empty decks
  for (const key in fighterDeck) {
    if (fighterDeck[key].length === 0) {
      fighterDeck[key] = fighterDecks["default"][key];
    }
  }
  if (equipmentDeck.equipment.length === 0) {
    equipmentDeck.equipment = equipmentDecks["default"].equipment;
  }
  if (mapDeck.maps.length === 0) {
    mapDeck.maps = mapDecks["default"].maps;
  }

  return {
    fighters: fighterDeck,
    equipment: equipmentDeck,
    maps: mapDeck
  }
}

export function isValidEquipmentBR(team: Team, equipment: number[]): boolean {
  const usedEquipmentIds: number[] = [];
  let usedSlots: EquipmentSlot[] = [];
  for (const e of equipment) {
    if (e < 0 || e >= team.equipment.length || usedEquipmentIds.includes(e)) {
      return false;
    }
    usedSlots = usedSlots.concat(team.equipment[e].slots);
    usedEquipmentIds.push(e);
  }
  return usedSlots.filter(s => s === EquipmentSlot.Head).length <= 1 &&
      usedSlots.filter(s => s === EquipmentSlot.Torso).length <= 1 &&
      usedSlots.filter(s => s === EquipmentSlot.Hand).length <= 2 &&
      usedSlots.filter(s => s === EquipmentSlot.Legs).length <= 1 &&
      usedSlots.filter(s => s === EquipmentSlot.Feet).length <= 1;
}

export function isValidEquipmentTournament(team: Team, equipment: number[][]): boolean {
  if (equipment.length !== team.fighters.length) {
    return false;
  }
  const usedEquipment: number[] = [];
  for (const f of equipment) {
    let usedSlots: EquipmentSlot[] = [];
    for (const e of f) {
      if (e < 0 || e >= team.equipment.length) {
        return false;
      }
      if (usedEquipment.includes(e)) {
        return false;
      }
      usedEquipment.push(e);
      usedSlots = usedSlots.concat(team.equipment[e].slots);
    }
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

// Simulate the fight and return the order of teams in it, going from winner to first out
export function simulateFight(
  eventEmitter: (event: MayhemManagerEvent) => void,
  map: Map,
  rng: RNG,
  fighters: FighterInBattle[]
): number[] {
  const fight = new Fight(map, rng, fighters);
  fight.simulate();
  eventEmitter({
    type: "fight",
    map,
    eventLog: fight.eventLog
  });
  return fight.placementOrder;
}

class Fight {
  private map: Map
  private rng: RNG
  private fighters: FighterInBattle[]
  eventLog: MidFightEvent[][]
  placementOrder: number[]

  constructor(
    map: Map,
    rng: RNG,
    fighters: FighterInBattle[]
  ) {
    this.map = map;
    this.rng = rng;
    // clone each fighter and their stats and abilities objects so we can mutate them temporarily
    this.fighters = fighters.map((f) => {
      return {
        ...f,
        stats: { ...f.stats },
        abilities: { ...f.abilities }
      };
    });
    this.eventLog = [];
    this.placementOrder = [];
  }

  // Returns the closest fighter not on fighter f's team
  closestNotOnTeam(f: FighterInBattle): FighterInBattle {
    return this.fighters
        .filter(f2 => f2.team !== f.team && f2.hp > 0)
        .sort((a, b) => distance(a, f) - distance(b, f))[0];
  }

  // Simulates the fight
  simulate(): void {
    const initialTick: MidFightEvent[] = [];

    // place the fighters evenly spaced in a circle of radius 25 centered at (0, 0)
    this.fighters.forEach((f, i) => {
      f.x = 50 + -25 * Math.cos(2 * Math.PI * i / this.fighters.length);
      f.y = 50 + 25 * Math.sin(2 * Math.PI * i / this.fighters.length);

      initialTick.push({
        type: "spawn",
        fighter: {  // f will be mutated during the fight so we need a current snapshot
          ...f,
          x: Number(f.x.toFixed(2)),  // round to save data
          y: Number(f.y.toFixed(2)),
          stats: { ...f.stats },
          abilities: { ...f.abilities }
        }
      });
    });

    this.eventLog.push(initialTick);
    writeFileSync("logs/ticks.txt", JSON.stringify(initialTick));

    while (!this.fightIsOver()) {
      const tick: MidFightEvent[] = [];
      this.fighters.forEach((f, i) => {
        if (f.hp <= 0) return;  // do nothing if fighter is down
        const target = this.closestNotOnTeam(f);
        if (!target) return;  // in case your teammate downed the last enemy
        const distanceToTarget = distance(f, target);
        if (distanceToTarget > 2) {
          // move toward the target by the max the fighter's speed allows or until within 1.5 m,
          // whichever is less. fighters with 0 speed can move 2.5 m/s, fighters with 10 speed move
          // 7.5 m/s
          const distanceToMove = Math.min((2.5 + f.stats.speed / 2) * TICK_LENGTH,
                                          distanceToTarget - 1.5);
          const deltaX = Math.pow(target.x - f.x, 2) / Math.pow(distanceToTarget, 2) * distanceToMove;
          const deltaY = Math.pow(target.y - f.y, 2) / Math.pow(distanceToTarget, 2) * distanceToMove;
          f.x += Math.sign(target.x - f.x) * deltaX;
          f.y += Math.sign(target.y - f.y) * deltaY;
          tick.push({
            type: "move",
            fighter: i,
            x: Number(f.x.toFixed(2)),  // round to save data
            y: Number(f.y.toFixed(2))
          });
        }
        // if within melee range (2 m) and not cooling down, attack.
        // added a bit of buffer in case rounding adds imprecision to the cooldown
        if (distance(f, target) <= 2 && f.cooldown < 0.0001) {
          // choose a random melee weapon if one is equipped; otherwise punch.
          const meleeWeapons = f.equipment.filter(e => 
            e.abilities.find(a => a.type === "meleeAttack") !== undefined
          );
          let baseDamage = 1;
          if (meleeWeapons.length !== 0) {
            const weaponChosen = this.rng.randElement(meleeWeapons);
            baseDamage = (weaponChosen.abilities.find(a => a.type === "meleeAttack") as MeleeAttackAbility).damage;
            if (f.attunements.includes(weaponChosen.name)) {
              baseDamage *= 1.25;
            }
          }
          // if the target has 0 reflexes, they have no chance to dodge. if they have 10 reflexes,
          // they have a 50% chance to dodge.
          const dodged = this.rng.randReal() < target.stats.reflexes / 20;
          // base damage is 5 + fighter's strength. this is reduced by 0% if the target has 0
          // toughness, 50% if they have 10 toughness. it is multiplied by the weapon's damage.
          // damage is roundedup to the nearest integer.
          let damage = Math.ceil(baseDamage *
              (5 + f.stats.strength) *
              (1 - target.stats.toughness / 20));
          if (dodged) {
            damage = 0;
          }
          target.hp -= damage;
          tick.push({
            type: "meleeAttack",
            fighter: i,
            target: this.fighters.findIndex(f2 => f2 === target),
            dodged,
            damage
          });

          // cooldown is 5 seconds for a fighter with 0 energy, 2.5 seconds if 10 energy
          f.cooldown = 5 * (1 - 0.05 * f.stats.energy);
        }

        // decrease cooldown. cooldown can go slightly below 0 to compensate for if a cooldown
        // is not a multiple of tick length, but if already at or below 0 it cannot go lower
        f.cooldown = f.cooldown <= 0.0001 ? 0 : f.cooldown - TICK_LENGTH;
      });
      // we stringify the tick so later mutations don't mess up earlier ticks
      this.eventLog.push(tick);
      writeFileSync("logs/ticks.txt", JSON.stringify(tick), { flag: "a+" });
    }
  }

  fightIsOver(): boolean {
    const teamsRemaining: number[] = [];
    const teamsInBattle: number[] = [];
    for (const f of this.fighters) {
      if (f.hp > 0 && !teamsRemaining.includes(f.team)) {
        teamsRemaining.push(f.team);
      }
      if (!teamsInBattle.includes(f.team)) {
        teamsInBattle.push(f.team);
      }
    }
    // add newly eliminated teams to the front of the placement order
    for (const t of teamsInBattle) {
      if (!teamsRemaining.includes(t) && !this.placementOrder.includes(t)) {
        this.placementOrder.unshift(t);
      }
    }
    // the fight is over when no more than 1 team has fighters remaining
    // if there is a team left, add them to the front of the placement order
    if (teamsRemaining.length === 1) {
      this.placementOrder.unshift(teamsRemaining[0]);
    }
    return teamsRemaining.length <= 1;
  }
}

// Calculate the Euclidean distance between two fighters in the x-y plane
function distance(f1: FighterInBattle, f2: FighterInBattle): number {
  return Math.sqrt(Math.pow(f1.x - f2.x, 2) + Math.pow(f1.y - f2.y, 2));
}