import { StatName } from "$lib/mayhem-manager/types";
import type { Equipment, Fighter, MayhemManagerGameStage, PreseasonTeam, Team } from "$lib/mayhem-manager/types";
import { fighterValueInBattle } from "./fighter-value";
import { isValidEquipmentFighter } from "./utils";

const Bot = {
  getPreseasonPicks: function (team: PreseasonTeam): {
    fighters: number[]
    equipment: number[]
  } {
    // pick each affordable fighter and equipment that improves the team's quality
    // could be better optimized (too greedy as of now) but whatever
    let bestResigns = [];
    let bestRepairs = [];
    let bestQuality = situationQuality(team, "preseason");

    team.needsRepair.forEach((e, i) => {
      if (e.price > team.money) return;
      team.equipment.push(e);
      team.money -= e.price;
      const newQuality = situationQuality(team, "preseason");
      if (newQuality >= bestQuality) {
        bestRepairs.push(i);
        bestQuality = newQuality;
      } else {
        team.equipment.pop();
        team.money += e.price;
      }
    });
    team.needsResigning.forEach((f, i) => {
      if (f.price > team.money) return;
      team.fighters.push(f);
      team.money -= f.price;
      const newQuality = situationQuality(team, "preseason");
      if (newQuality >= bestQuality) {
        bestResigns.push(i);
        bestQuality = newQuality;
      } else {
        team.fighters.pop();
        team.money += f.price;
      }
    });

    // remove all picked fighters and equpment at end. not in middle since need to evaluate picks
    // alongside previous picks
    for (const i of bestResigns) {
      team.fighters.pop();
      team.money += team.needsResigning[i].price;
    }
    for (const i of bestRepairs) {
      team.equipment.pop();
      team.money += team.needsRepair[i].price;
    }

    return {
      fighters: bestResigns,
      equipment: bestRepairs
    };
  },
  getDraftPick: function (team: Team, fighters: Fighter[]): number {
    // pick the fighter that improves the team's total power the most
    let bestFighter: number;
    let bestQuality: number;

    fighters.forEach((f, i) => {
      team.fighters.push(f);
      const newQuality = situationQuality(team, "draft");
      if (bestFighter === undefined || newQuality >= bestQuality) {
        bestFighter = i;
        bestQuality = newQuality;
      }
      team.fighters.pop();
    });

    return bestFighter;
  },
  getFAPicks: function (team: Team, fighters: Fighter[]): number[] {
    // pick each affordable fighter that improves the team's quality
    // could be better optimized (too greedy as of now) but whatever
    let bestFighters = [];
    let bestQuality = situationQuality(team, "free agency");

    fighters.forEach((f, i) => {
      if (f.price > team.money) return;
      team.fighters.push(f);
      team.money -= f.price;
      const newQuality = situationQuality(team, "free agency");
      if (newQuality >= bestQuality) {
        bestFighters.push(i);
        bestQuality = newQuality;
      } else {
        team.fighters.pop();
        team.money += f.price;
      }
    });

    // remove all picked fighters at end. not in middle since need to evaluate picks alongside
    // previous picks
    for (const i of bestFighters) {
      team.fighters.pop();
      team.money += fighters[i].price;
    }

    return bestFighters;
  },
  getTrainingPicks: function (team: Team, equipment: Equipment[]): {
    equipment: number[]
    skills: (number | StatName)[]
  } {
    // pick each affordable equipment that improves the team's quality
    // could be better optimized (too greedy as of now) but whatever
    let bestEquipment = [];
    let bestQuality = situationQuality(team, "training");

    equipment.forEach((e, i) => {
      if (e.price > team.money) return;
      team.equipment.push(e);
      team.money -= e.price;
      const newQuality = situationQuality(team, "training");
      if (newQuality >= bestQuality) {
        bestEquipment.push(i);
        bestQuality = newQuality;
      } else {
        team.equipment.pop();
        team.money += e.price;
      }
    });

    // remove all picked equipment at end. not in middle since need to evaluate picks alongside
    // previous picks
    for (const i of bestEquipment) {
      team.equipment.pop();
      team.money += equipment[i].price;
    }

    return {
      equipment: bestEquipment,
      skills: team.fighters.map((f) => {
        for (const statName of [StatName.Strength, StatName.Accuracy, StatName.Energy, StatName.Toughness, StatName.Speed]) {
          if (f.stats[statName] <= 9 && f.stats[statName] >= 6) {
            return statName
          }
        }
        return StatName.Toughness;
      })
    };
  },
  getBRPicks: function (team: Team): {
    fighter: number
    equipment: number[]
  } {
    const picks = bestPicksBR(team);
    return {
      fighter: picks.fighter,
      equipment: picks.equipment
    };
  },
  getFightPicks: function (team: Team): number[][] {
    return bestPicks(team).picks;
  }
};

// very simple, should be improved
function situationQuality(team: Team, gameStage: MayhemManagerGameStage): number {
  let moneyValue = team.money;  // 1 power in picks + 1 power in BR = $1
  if (moneyValue > 125) {
    moneyValue = 125 + (moneyValue - 125) / 2;
  }
  if (gameStage === "free agency") {
    if (moneyValue > 100) {
      moneyValue = 100 + (moneyValue - 100) / 2;
    }
    if (moneyValue > 75) {
      moneyValue = 75 + (moneyValue - 75) / 2;
    }
    moneyValue *= 0.75;
  } else if (gameStage === "training") {
    if (moneyValue > 75) {
      moneyValue = 75 + (moneyValue - 75) / 2;
    }
    if (moneyValue > 50) {
      moneyValue = 50 + (moneyValue - 50) / 2;
    }
    moneyValue *= 0.4;
  }
  return bestPicks(team).power + bestPicksBR(team).power + moneyValue;
}

// Find best possible picks optimizing for sum of power
function bestPicks(team: Team): {
  picks: number[][],
  power: number
} {
  // try on most dangerous / powerful equipment first (should be based on base price but that is not persistent)
  const equipment = team.equipment.slice();
  const picks: number[][] = team.fighters.map(_ => []);
  const power: number[] = team.fighters.map(f => fighterValueInBattle(f, []));

  // for each piece of equipment, assign it to the fighter who improves most (assuming at least one can wear it)
  equipment.forEach((_, i) => {
    let bestFighter: number;
    let bestImprovement: number;
    team.fighters.forEach((f, j) => {
      // skip if fighter cannot wear this equipment while already wearing their other equipment
      if (!isValidEquipmentFighter(team, picks[j].concat(i))) return;
      // try it on and check how much the fighter's power improves
      const valueBefore = fighterValueInBattle(f, picks[j].map(p => team.equipment[p]));
      picks[j].push(i);
      const valueAfter = fighterValueInBattle(f, picks[j].map(p => team.equipment[p]));
      picks[j].pop();
      if (bestFighter === undefined || valueAfter - valueBefore > bestImprovement) {
        bestFighter = j;
        bestImprovement = 1;
      }
    });
    if (bestFighter !== undefined) {
      picks[bestFighter].push(i);
      power[bestFighter] = fighterValueInBattle(team.fighters[bestFighter], picks[bestFighter].map(p => team.equipment[p]));
    }
  });

  return {
    picks,
    power: power.reduce((a, b) => a + b, 0)
  };
}

// Find best possible picks optimizing for best fighter power
function bestPicksBR(team: Team): {
  fighter: number,
  equipment: number[],
  power: number
} {
  // try on most dangerous / powerful equipment first (should be based on base price but that is not persistent)
  const equipment = team.equipment.slice();
  const picks: number[][] = team.fighters.map(_ => []);
  const power: number[] = team.fighters.map(f => fighterValueInBattle(f, []));

  // for each piece of equipment, assign it to the fighter who improves most (assuming at least one can wear it)
  equipment.forEach((e, i) => {
    team.fighters.forEach((f, j) => {
      // skip if fighter cannot wear this equipment while already wearing their other equipment
      if (!isValidEquipmentFighter(team, picks[j].concat(i))) return;
      // put it on (i think this is not the best way to do it, but works for now)
      picks[j].push(i);
      power[j] = fighterValueInBattle(f, picks[j].map(p => team.equipment[p]));
      // unlike bestPicks(), do not remove the equipment
    });
  });

  let bestFighter: number = 0;
  let bestFighterPower: number = power[0];
  power.forEach((p, i) => {
    if (p > bestFighterPower) {
      bestFighter = i;
      bestFighterPower = p;
    }
  });
  return {
    fighter: bestFighter,
    equipment: picks[bestFighter],
    power: power[bestFighter]
  };
}

export default Bot;