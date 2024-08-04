import { readFileSync, writeFileSync } from "fs";
import { StatName, type Appearance, type Equipment, type EquipmentTemplate, type Fighter, type FighterStats } from "$lib/mayhem-manager/types";
import { isValidEquipment } from "$lib/mayhem-manager/utils";
import { Fight, FighterInBattle } from "$lib/mayhem-manager/battle-logic";
import { equipmentCatalog, fighterAbilitiesCatalog, getEquipmentForPick } from "$lib/mayhem-manager/decks";

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
      fightersInBattle.push(
        new FighterInBattle(
          {
            ...team.fighters[j],
            stats: { ...team.fighters[j].stats }
          },
          team.equipment[j],
          i
        )
      );
    }
  }
  // get winner of the fight and store the ending HP of every fighter
  const fight = new Fight(new RNG(params.seed), fightersInBattle);
  fight.simulate();
  writeFileSync(
    FILEPATH_BASE + "fight-results.json",
    JSON.stringify({
      ordering: fight.placementOrder,
      hp: fight.fighters.map(f => f.hp)
    })
  );
  return {
    teams: params.teams.map(t => ({
      fighters: t.fighters,
      equipment: t.equipment.map(outer => outer.map(e => e.name))
    })),
    ordering: fight.placementOrder,
    hp: fight.fighters.map(f => f.hp)
  }
}

function randomFighter(name: string = ""): Fighter {
  const abilityNames = Object.keys(fighterAbilitiesCatalog);

  return {
    name,
    stats: randomFighterStats(),
    attunements: randomAttunements(),
    experience: 0,
    price: 0,
    description: "",
    flavor: "",
    appearance: {} as unknown as Appearance,
    abilityName: abilityNames[Math.floor(Math.random() * abilityNames.length)]
  };
}

function randomEquipment(numTries: number): Equipment[] {
  const equipmentNames = Object.keys(equipmentCatalog);
  const used: Equipment[] = [];

  for (let i = 0; i < numTries; i++) {
    const template = equipmentNames[Math.floor(Math.random() * equipmentNames.length)];
    used.push(getEquipmentForPick(template));
    if (!isValidEquipment(used)) {
      used.pop();
    }
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

function randomAttunements(): string[] {
  const attunements = [];
  for (const e of Object.values(equipmentCatalog)) {
    if (Math.random() < 0.2) {
      attunements.push(e.name);
    }
  }
  return attunements;
}

function duelToCsv(fight: FightRecord): string {
  const row: number[] = [];
  const fighterAbilityNames = Object.keys(fighterAbilitiesCatalog);
  const equipmentNames = Object.keys(equipmentCatalog);
  const possibleHp = fight.teams[fight.ordering[0]].fighters.length * 100;
  let remainingHp = 0;
  for (let hp of fight.hp) {
    remainingHp += Math.max(hp, 0);
  }
  row.push(fight.ordering[0] === 0 ?
           (1 + remainingHp / possibleHp) :
           (-1 - remainingHp / possibleHp));
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 6; j++) {
      if (fight.teams[i].fighters.length > j) {
        for (let stat of Object.values(fight.teams[i].fighters[j].stats)) {
          row.push(stat);
        }
        for (let n of fighterAbilityNames) {
          row.push(fight.teams[i].fighters[j].abilityName === n ? 1 : 0);
        }
        for (let n of equipmentNames) {
          row.push(fight.teams[i].equipment[j].filter(e => e === equipmentCatalog[n].name).length);
        }
        for (let n of equipmentNames) {
          row.push(fight.teams[i].fighters[j].attunements.includes(equipmentCatalog[n].name) ? 1 : 0);
        }
      } else {
        for (let _ of Array(5).fill(0)) {
          row.push(0);
        }
        for (let _ of fighterAbilityNames) {
          row.push(0);
        }
        for (let _ of equipmentNames) {
          row.push(0);
        }
        for (let _ of equipmentNames) {
          row.push(0);
        }
      }
    }
  }
  return row.join(",");
}

function csvHeader(): string {
  const row: string[] = ["result"];
  const fighterAbilityNames = Object.keys(fighterAbilitiesCatalog);
  const equipmentNames = Object.keys(equipmentCatalog);
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 6; j++) {
      for (let n of Object.values(StatName)) {
        row.push(`t${i}_f${j}_${n}`);
      }
      for (let n of fighterAbilityNames) {
        row.push(`t${i}_f${j}_${n}`);
      }
      for (let n of equipmentNames) {
        row.push(`t${i}_f${j}_${n}`);
      }
      for (let n of equipmentNames) {
        row.push(`t${i}_f${j}_${n}_att`);
      }
    }
  }
  return row.join(",");
}

export function duelSample(n: number = 1000): void {
  const fights: FightRecord[] = [];
  for (let i = 0; i < n; i++) {
    const teams: {
      fighters: Fighter[],
      equipment: Equipment[][]
    }[] = [];
    for (let j = 0; j < 2; j++) {
      teams.push({
        fighters: [],
        equipment: []
      })
      const numFighters = Math.ceil(Math.random() * 6);
      for (let k = 0; k < numFighters; k++) {
        teams[j].fighters.push(randomFighter());
        teams[j].equipment.push(randomEquipment(Math.round(Math.random() * 6)));
      }
    }
    fights.push(
      simTestFight({
        teams,
        seed: [
          Math.random() * 4294967296,
          Math.random() * 4294967296,
          Math.random() * 4294967296,
          Math.random() * 4294967296
        ]
      })
    );
  }
  writeFileSync(
    FILEPATH_BASE + "duel-sample.csv",
    csvHeader() + "\n" + fights.map(duelToCsv).join("\n")
  );
}

export function brSample(n: number = 1000): void {
  const fights: FightRecord[] = [];
  for (let i = 0; i < n; i++) {
    const powerLevel = 1 + Math.floor(Math.random() * 11);
    const teams: {
      fighters: Fighter[],
      equipment: Equipment[][]
    }[] = [];
    const numTeams = 2 + Math.floor(Math.random() * Math.random() * 14);
    for (let j = 0; j < numTeams; j++) {
      const numEquipment = Math.floor(Math.random() * powerLevel);
      teams.push({
        fighters: [randomFighter()],
        equipment: [randomEquipment(numEquipment)]
      });
    }
    fights.push(
      simTestFight({
        teams,
        seed: [1, 2, Math.floor(Math.random() * 1000000), Math.floor(Math.random() * 1000000)]
      })
    );
  }
  writeFileSync(
    FILEPATH_BASE + "br-sample.json",
    JSON.stringify(fights)
  );
}