import { simulateFight } from "$lib/mayhem-manager/battle-logic";
import { readFileSync, writeFileSync } from "fs";
import type { Equipment, Fighter, FighterInBattle, MayhemManagerEvent } from "$lib/mayhem-manager/types";

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

const FILEPATH_BASE = "src/lib/test/";

// Simulates a fight between the fighters stored in fight-parameters.json and
// writes the results to fight-results.json.
export default function simTestFight(): void {
    // get fighters
    const params: TestParams = JSON.parse(
        readFileSync(FILEPATH_BASE + "fight-parameters.json").toString());
    const fightersInBattle: FighterInBattle[] = [];
    for (let i = 0; i < params.teams.length; i++) {
        const team = params.teams[i];
        for (let j = 0; j < team.fighters.length; j++) {
            fightersInBattle.push({
                ...team.fighters[j],
                team: i,
                hp: 100,
                maxHP: 100,
                equipment: team.equipment[j],
                x: 0,
                y: 0,
                cooldown: 0,
                statusEffects: []
            });
        }
    }
    // get winner of the fight and store the ending HP of every fighter
    const hp = Array(fightersInBattle.length).fill(100);
    const results = simulateFight(
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
        {
            name: "",
            imgUrl: "",
            features: []
        },
        new RNG(params.seed),
        fightersInBattle
    );
    writeFileSync(
        FILEPATH_BASE + "fight-results.json",
        JSON.stringify({
            results,
            hp
        })
    );
}