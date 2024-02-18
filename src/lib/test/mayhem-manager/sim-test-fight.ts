import { collatedSettings, simulateFight } from "$lib/mayhem-manager/battle-logic";
import { readFileSync, writeFileSync } from "fs";
import type { Appearance, Equipment, EquipmentTemplate, Fighter, FighterInBattle, FighterStats, MayhemManagerEvent } from "$lib/mayhem-manager/types";
import { isValidEquipment } from "$lib/mayhem-manager/utils";

class RNG {
  rngState: [number, number, number, number]

  constructor(seed: [number, number, number, number]) {
  this.rngState = seed;
  }

  // Generates random integers between min and max, inclusive, using jsf32b PRNG
  randInt(min: number, max: number): number {
  this.rngState[0] |= 0;
  this.rngState[1] |= 0;
  this.rngState[2] |= 0;
  this.rngState[3] |= 0;
  const t = this.rngState[0] - (this.rngState[1] << 23 | this.rngState[1] >>> 9) | 0;
  this.rngState[0] = this.rngState[1] ^ (this.rngState[2] << 16 | this.rngState[2] >>> 16) | 0;
  this.rngState[1] = this.rngState[2] + (this.rngState[3] << 11 | this.rngState[3] >>> 21) | 0;
  this.rngState[1] = this.rngState[2] + this.rngState[3] | 0x0;
  this.rngState[2] = this.rngState[3] + t | 0x0;
  this.rngState[3] = this.rngState[0] + t | 0x0;
  return min + Math.floor((max + 1 - min) * (this.rngState[3] >>> 0) / 4294967296);
  }

  // Select a random element from an array
  randElement<T>(array: T[]): T {
  return array[this.randInt(0, array.length - 1)];
  }

  // Select a random element from an array
  randReal(): number {
  return this.randInt(0, 4294967295) / 4294967296;
  }
}

interface TestParams {
  teams: {
    fighters: Fighter[],
    equipment: Equipment[][]
  }[],
  seed: [number, number, number, number]
}

interface FightRecord {
  teams: {
    fighters: Fighter[],
    equipment: string[][]
  }[],
  ordering: number[],
  hp: number[]
}

const FILEPATH_BASE = "src/lib/test/mayhem-manager/";

// Simulates a fight between the fighters stored in fight-parameters.json and
// writes the results to fight-results.json.
export function simTestFight(params?: TestParams): FightRecord {
  // get fighters
  if (!params) {
    params = JSON.parse(
      readFileSync(FILEPATH_BASE + "fight-parameters.json").toString());
  }
  const fightersInBattle: FighterInBattle[] = [];
  for (let i = 0; i < params.teams.length; i++) {
    const team = params.teams[i];
    for (let j = 0; j < team.fighters.length; j++) {
      fightersInBattle.push({
        ...team.fighters[j],
        team: i,
        hp: 100,
        equipment: team.equipment[j],
        x: 0,
        y: 0,
        cooldown: 0,
        charge: 0,
        statusEffects: []
      });
    }
  }
  // get winner of the fight and store the ending HP of every fighter
  const hp = Array(fightersInBattle.length).fill(100);
  const ordering = simulateFight(
    (event) => {
      if (event.type === "fight") {
        for (const tick of event.eventLog) {
          for (const e of tick) {
            if (e.type === "hpChange") {
              hp[e.fighter]= e.newHp;
            }
          }
        }
      }
    },
    new RNG(params.seed),
    fightersInBattle
  );
  writeFileSync(
    FILEPATH_BASE + "fight-results.json",
    JSON.stringify({
      results: ordering,
      hp
    })
  );
  return {
    teams: params.teams.map(t => ({
      fighters: t.fighters,
      equipment: t.equipment.map(outer => outer.map(e => e.name))
    })),
    ordering,
    hp
  }
}

function randomFighter(equipment: EquipmentTemplate[], name: string = ""): Fighter {
  return {
    name,
    gender: "A",
    stats: randomFighterStats(),
    attunements: randomAttunements(equipment),
    abilities: {},
    experience: 0,
    price: 0,
    description: "",
    flavor: "",
    appearance: {} as unknown as Appearance
  };
}

function randomEquipment(equipment: EquipmentTemplate[], numEquipment: number): Equipment[] {
  numEquipment = Math.max(0, Math.floor(numEquipment + Math.random() - 0.5));
  const used: Equipment[] = [];

  let tries = 0;
  while (used.length < numEquipment && tries < 20) {
    const template = equipment[Math.floor(Math.random() * equipment.length)];
    used.push({
      ...template,
      yearsOwned: 0,
      price: 0,
      description: "",
      flavor: ""
    });
    if (!isValidEquipment(used)) {
      used.pop();
    }
    tries++;
  }

  return used;
}

function randomFighterStats(): FighterStats {
  return {
    strength: Math.floor(Math.random() * 11),
    accuracy: Math.floor(Math.random() * 11),
    energy: Math.floor(Math.random() * 11),
    speed: Math.floor(Math.random() * 11),
    toughness: Math.floor(Math.random() * 11)
  };
}

function randomAttunements(equipment: EquipmentTemplate[]): string[] {
  const attunements = [];
  for (const e of equipment) {
    if (Math.random() < 0.1) {
      attunements.push(e.name);
    }
  }
  return attunements;
}

export function simSample(n: number = 1000): void {
  const equipment = collatedSettings({
    customFighters: [], 
    customEquipment: []
  }).equipment;
  const fights: FightRecord[] = [];
  for (let i = 0; i < n; i++) {
    const isBR = Math.random() < 0.3;
    const powerLevel = 1 + Math.floor(Math.random() * 11);
    const teams: {
      fighters: Fighter[],
      equipment: Equipment[][]
    }[] = [];
    if (isBR) {
      const numTeams = 2 + Math.floor(Math.random() * Math.random() * 14);
      for (let j = 0; j < numTeams; j++) {
        const numEquipment = Math.floor(Math.random() * powerLevel);
        teams.push({
          fighters: [randomFighter(equipment, j.toString())],
          equipment: [randomEquipment(equipment, numEquipment)]
        });
      }
    } else {
      for (let j = 0; j < 2; j++) {
        const numFighters = Math.max(Math.floor(Math.random() * powerLevel * 0.7), 1);
        const numEquipment = (powerLevel - numFighters) / numFighters;
        teams.push({
          fighters: [...Array(numFighters)].map((_, k) => randomFighter(equipment, j.toString() + " " + k.toString())),
          equipment: [...Array(numFighters)].map(_ => randomEquipment(equipment, numEquipment))
        });
      }
    }
    fights.push(
      simTestFight({
        teams,
        seed: [1, 2, 3, 4]
      })
    );
  }
  writeFileSync(
    FILEPATH_BASE + "fight-sample.json",
    JSON.stringify(fights)
  );
}