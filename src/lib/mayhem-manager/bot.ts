import { StatName } from "$lib/mayhem-manager/types";
import type { Abilities, Equipment, Fighter, MayhemManagerGameStage, PreseasonTeam, Team } from "$lib/mayhem-manager/types";
import { FISTS, FighterInBattle, isValidEquipmentFighter } from "./battle-logic";

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
    let bestFighter;
    let bestQuality;

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
  let moneyValue = 1.5;  // 1 power in picks + 1 power in BR = $1
  if (gameStage === "free agency") {
    moneyValue *= 0.8;
  } else if (gameStage === "training") {
    moneyValue *= 0.4;
  }
  // console.log(bestPicks(team));
  // add power, money, and a little bonus for just having more fighters / equipment
  let stuffBonus = team.equipment.length;
  // for (const f of team.fighters) {
  //   stuffBonus += 0.1 * Math.max(1, 20 - f.experience);
  // }
  return bestPicks(team).power + 0.5 * bestPicksBR(team).power + moneyValue * team.money + stuffBonus;
}

// Find best possible picks optimizing for sum of power
function bestPicks(team: Team): {
  picks: number[][],
  power: number
} {
  // try on most dangerous / powerful equipment first (should be based on base price but that is not persistent)
  const equipment = team.equipment.slice();
  const picks: number[][] = team.fighters.map(_ => []);
  const power: number[] = team.fighters.map(_ => 0);

  // for each piece of equipment, assign it to the fighter who improves most (assuming at least one can wear it)
  equipment.forEach((e, i) => {
    let bestFighter: number;
    let bestImprovement: number;
    team.fighters.forEach((f, j) => {
      // skip if fighter cannot wear this equipment while already wearing their other equipment
      if (!isValidEquipmentFighter(team, picks[j].concat(i))) return;
      // try it on and check how much the fighter's power improves
      // f.equipment.push(e);
      // f.equipment.pop();
      bestFighter = j;
      bestImprovement = 1;
    });
    if (bestFighter !== undefined) {
      picks[bestFighter].push(i);
      // team.fighters[bestFighter].equipment.push(e);
      power[bestFighter] += bestImprovement;
    }
  });

  return {
    picks,
    power: power.reduce((a, b) => a + b, 0)
  };
}

// Find best possible picks optimizing for sum of power
function bestPicksBR(team: Team): {
  fighter: number,
  equipment: number[],
  power: number
} {
  // try on most dangerous / powerful equipment first (should be based on base price but that is not persistent)
  const equipment = team.equipment.slice();
  const picks: number[][] = team.fighters.map(_ => []);
  const power: number[] = team.fighters.map(f => 0);

  // for each piece of equipment, assign it to the fighter who improves most (assuming at least one can wear it)
  equipment.forEach((e, i) => {
    team.fighters.forEach((f, j) => {
      // skip if fighter cannot wear this equipment while already wearing their other equipment
      if (!isValidEquipmentFighter(team, picks[j].concat(i))) return;
      // try it on and check how much the fighter's power improves
      // f.equipment.push(e);
      picks[j].push(i);
      power[j] = 1;
      // unlike bestPicks(), do not remove the equipment
    });
  });

  const bestFighter = power.indexOf(power.reduce((a, b) => Math.max(a, b), 0));
  return {
    fighter: bestFighter,
    equipment: picks[bestFighter],
    power: power.reduce((a, b) => a + b, 0)
  };
}

export default Bot;