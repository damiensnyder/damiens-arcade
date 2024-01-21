import { z } from "zod";
import { readFileSync, writeFileSync } from "fs";
import { EquipmentSlot, type Equipment, type FighterInBattle, type FighterNames, type FighterTemplate, type MidFightEvent, type Settings, type Team, type MayhemManagerEvent, StatName, Target, Trigger, type TriggeredEffect, type Effect, type EquipmentTemplate, ActionAnimation, type Abilities } from "$lib/mayhem-manager/types";
import type { RNG } from "$lib/types";

export const FISTS: Equipment = {
  name: "fists",
  imgUrl: "",
  zoomedImgUrl: "",
  slots: [],
  abilities: {
    action: {
      target: Target.Melee,
      effects: [{
        type: "damage",
        amount: 5
      }],
      cooldown: 5
    },
    aiHints: {
      actionDanger: 1,
      actionStat: StatName.Strength
    }
  },
  yearsOwned: 0,
  price: 0,
  description: "",
  flavor: ""
};
const CROWDING_DISTANCE = 3;  // at less than this distance, fighters repel
const MELEE_RANGE = 4;  // at less than this distance, fighters repel



const hpChangeEffect = z.object({
  type: z.literal("hpChange"),
  amount: z.number().int()
});

const damageEffect = z.object({
  type: z.literal("damage"),
  amount: z.number()
});

const statChangeEffect = z.object({
  type: z.literal("statChange"),
  stat: z.nativeEnum(StatName),
  amount: z.number().int(),
  duration: z.number(),
  tint: z.array(z.number()).length(4).optional()
});

const effect = z.union([hpChangeEffect, damageEffect, statChangeEffect]);

const actionAbility = z.object({
  target: z.nativeEnum(Target),
  effects: z.array(effect),
  cooldown: z.number().min(0),
  danger: z.number(),
  chargeNeeded: z.number().int().min(0).optional(),
  dodgeable: z.boolean().optional(),
  missable: z.boolean().optional(),
  animation: z.nativeEnum(ActionAnimation).optional(),
  projectileImg: z.string().optional(),
  knockback: z.number().optional()
});

const statChangeAbility = z.object({
  stat: z.nativeEnum(StatName),
  amount: z.number()
});

const triggeredEffect = z.intersection(
  effect,
  z.object({
    trigger: z.nativeEnum(Trigger),
    target: z.nativeEnum(Target)
  })
);

const abilities = z.object({
  action: actionAbility.optional(),
  statChanges: z.array(statChangeAbility).optional(),
  triggeredEffects: z.array(triggeredEffect).optional()
});

const DECK_FILEPATH_BASE = "src/lib/mayhem-manager/data/";
export const TICK_LENGTH = 0.2;  // length of a tick in seconds
const EPSILON = 0.00001;  // to account for rounding errors

export const fighterNames: FighterNames =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "names.json").toString());
const defaultFighters: { fighters: FighterTemplate[] } =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "fighters.json").toString());
const defaultEquipment: { equipment: EquipmentTemplate[] } =
    JSON.parse(readFileSync(DECK_FILEPATH_BASE + "equipment.json").toString());

const fighterTemplateSchema = z.object({
  imgUrl: z.string().max(300),
  abilities: abilities,
  price: z.number().min(0).max(100).int(),
  description: z.string().max(300),
  flavor: z.string().max(300)
});

const equipmentTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  imgUrl: z.string().max(300),
  slots: z.array(z.nativeEnum(EquipmentSlot)),
  abilities: z.array(abilities),
  price: z.number().min(0).max(100).int(),
  description: z.string().max(300),
  flavor: z.string().max(300)
});

const settingsSchema = z.object({
  useDefaultFighters: z.boolean(),
  useDefaultEquipment: z.boolean(),
  customFighters: z.array(fighterTemplateSchema),
  customEquipment: z.array(equipmentTemplateSchema),
});

const changeGameSettingsSchema = z.object({
  type: z.literal("changeGameSettings"),
  settings: settingsSchema
});

export function settingsAreValid(settings: unknown): boolean {
  return changeGameSettingsSchema.safeParse(settings).success;
}

// Merge all the decks of settings into a single deck
export function collatedSettings(settings: Settings): {
  fighters: FighterTemplate[],
  equipment: EquipmentTemplate[],
} {
  return {
    fighters: settings.customFighters.concat(defaultFighters.fighters),
    equipment: settings.customEquipment.concat(defaultEquipment.equipment)
  }
}

export function isValidEquipmentFighter(team: Team, equipment: number[]): boolean {
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
  rng: RNG,
  fighters: FighterInBattle[]
): number[] {
  const fight = new Fight(rng, fighters);
  fight.simulate();
  eventEmitter({
    type: "fight",
    eventLog: fight.eventLog
  });
  return fight.placementOrder;
}

class Fight {
  private rng: RNG
  private fighters: FighterInBattle[]
  eventLog: MidFightEvent[][]
  placementOrder: number[]

  constructor(
    rng: RNG,
    fighters: FighterInBattle[]
  ) {
    this.rng = rng;
    // clone each fighter and their stats and abilities objects so we can mutate them temporarily
    this.fighters = fighters.map((f) => {
      return {
        ...f,
        equipment: f.equipment.slice(),
        stats: { ...f.stats },
        statusEffects: []
      };
    });
    this.eventLog = [];
    this.placementOrder = [];

    // do stat changes
    this.fighters.forEach((f) => {
      f.equipment.forEach(e => {
        (e.abilities.statChanges || []).forEach((a) => {
          f.stats[a.stat] += a.amount;
          if (f.attunements.includes(e.name)) {
            f.stats[a.stat] += 1;
          }
        });
      });
    });
  }

  // Returns the closest fighter not on fighter f's team
  closestEnemy(f: FighterInBattle): FighterInBattle {
    return this.enemies(f).sort((a, b) => distance(a, f) - distance(b, f))[0];
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
          abilities: { ...f.abilities },
          statusEffects: []
        }
      });
    });

    this.eventLog.push(initialTick);
    writeFileSync("logs/ticks.txt", JSON.stringify(initialTick));

    while (!this.fightIsOver()) {
      this.doTick();
    }
  }

  doTick(): void {
    const tick: MidFightEvent[] = [];
    this.fighters.forEach((f, i) => {
      if (f.hp <= 0) return;  // do nothing if fighter is down
      const closestEnemy = this.closestEnemy(f);
      if (!closestEnemy) return;  // do nothing if a teammate just downed the last enemy this tick
      // time it would take to get within melee range of closest
      const timeToClosest = Math.max(distance(f, closestEnemy) - 2, 0) / Math.max(2.5 + f.stats.speed / 2, 0.5);
      const engaged = distance(f, closestEnemy) <= 5;
      const ownEngageability = engageability(f);
      // console.log("Name:", f.name, "| Own engageability:", ownEngageability.toFixed(3));

      let bestAction: Abilities;
      let bestActionDanger: number;
      for (const e of (f.equipment as { abilities: Abilities }[]).concat(f, FISTS)) {
        if (e.abilities.action) {
          let currentActionDanger = actionDanger(f, e.abilities);
          if (e.abilities.action.target === Target.Melee) {
            currentActionDanger += 5 - timeToClosest;
          }
          if (bestActionDanger === undefined || currentActionDanger > bestActionDanger) {
            bestActionDanger = currentActionDanger
            bestAction = e.abilities;
          }
          // console.log("Fighter:", f.name, "| Action: ", (e as unknown as Equipment).name, "| Danger:", actionDanger);
        }
      }
      
      // if charges needed to use the action, then charge
      if (bestAction.action.chargeNeeded &&
          bestAction.action.chargeNeeded > f.charge) {
        if (engaged && engageability(closestEnemy) > 1.5 * ownEngageability) {
          this.moveAwayFromTarget(f, closestEnemy, tick);
        } else {
          this.charge(f, tick);
        }
      } else if (bestAction.action.target === Target.Melee) {
        // find the most engageable enemy fighter, taking into account distance
        let bestTarget: FighterInBattle;
        let bestTargetability: number;
        let bestTimeToEnemy = 0;
        for (const f2 of this.enemies(f)) {
          const timeToEnemy = Math.max(distance(f, f2) - 2, 0) / Math.max(2.5 + f.stats.speed / 2, 0.5);
          let e2 = this.targetability(f2);
          e2 -= 0.025 * Math.max(0, timeToEnemy - f.cooldown);
          if (bestTargetability === undefined || e2 >= bestTargetability) {
            bestTarget = f2;
            bestTargetability = e2;
            bestTimeToEnemy = timeToEnemy;
          }
        }
        // walk away if you're way closer to them than you need to be to attack. otherwise walk toward them
        if (bestTimeToEnemy < f.cooldown - 0.8) {
          this.moveAwayFromTarget(f, closestEnemy, tick);
        } else {
          this.moveTowardsTarget(f, bestTarget, tick);
          if (f.cooldown <= EPSILON && distance(f, bestTarget) <= MELEE_RANGE) {
            let attuned = (bestAction as unknown as Equipment).name && f.attunements.includes((bestAction as unknown as Equipment).name);
            this.doAction(f, bestAction, attuned, tick);
          }
        }
      } else {
        if (f.cooldown <= EPSILON) {
          let attuned = (bestAction as unknown as Equipment).name && f.attunements.includes((bestAction as unknown as Equipment).name);
          this.doAction(f, bestAction, attuned, tick);
        } else if (distance(f, closestEnemy) < 20) {
          this.moveAwayFromTarget(f, closestEnemy, tick);
        }
      }

      // tick down status effects, and end them if they're done
      let prevTint = [0, 0, 0, 0];
      let newTint: [number, number, number, number] = [0, 0, 0, 0];
      f.statusEffects.forEach((s) => {
        s.duration -= TICK_LENGTH;
        if (s.tint) {
          prevTint = s.tint;
          if (s.duration > 0) {
            newTint = s.tint;
          }
        }
        if (s.duration <= 0) {
          f.stats[s.stat] -= s.amount;
        }
      });
      f.statusEffects = f.statusEffects.filter((s) => s.duration > 0);
      if (!newTint.every((v, i) => v === prevTint[i])) {
        tick.push({
          type: "tint",
          fighter: i,
          tint: newTint
        });
      }

      // decrease cooldown. cooldown can go slightly below 0 to compensate for if a cooldown
      // is not a multiple of tick length, but if already at or below 0 it stays at 0
      f.cooldown = f.cooldown <= EPSILON ? 0 : f.cooldown - TICK_LENGTH;
    });
    
    // we stringify the tick so later mutations don't mess up earlier ticks
    writeFileSync("logs/ticks.txt", JSON.stringify(tick), { flag: "a+" });
    this.eventLog.push(tick);
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
    // forcibly end the match if it has been more than 5 minutes
    if (this.eventLog.length > 300 / TICK_LENGTH) {
      while (teamsRemaining.length > 0) {
        this.placementOrder.unshift(teamsRemaining.pop());
      }
    }

    return teamsRemaining.length <= 1;
  }

  // Moves f towards target as far as possible or within 1.5m, whichever is less. Returns the
  // distance traveled. 
  moveTowardsTarget(f: FighterInBattle, target: FighterInBattle, tick: MidFightEvent[]): number {
    const distanceToTarget = distance(f, target);
    const distanceToMove = Math.max(Math.min((2.5 + f.stats.speed / 2) * TICK_LENGTH,
                                    distanceToTarget - CROWDING_DISTANCE), 0);
    let [deltaX, deltaY] = scaleVectorToMagnitude(target.x - f.x, target.y - f.y, distanceToMove);

    // if too close to the wall, change direction to be less close to the wall.
    if (f.x + deltaX < CROWDING_DISTANCE) {
      deltaX = Math.abs(deltaX);
    } else if (f.x + deltaX > 100 - CROWDING_DISTANCE) {
      deltaX = -Math.abs(deltaX);
    }
    if (f.y + deltaY < CROWDING_DISTANCE) {
      deltaY = Math.abs(deltaY);
    } else if (f.y + deltaY > 100 - CROWDING_DISTANCE) {
      deltaY = -Math.abs(deltaY);
    }
    f.x += deltaX;
    f.y += deltaY;
    this.uncrowd(f);
    tick.push({
      type: "move",
      fighter: this.fighters.findIndex(f2 => f2 === f),
      x: Number(f.x.toFixed(2)),  // round to save data
      y: Number(f.y.toFixed(2))
    });
    return distanceToMove;
  }

  // Moves f away from target as far as possible.
  moveAwayFromTarget(f: FighterInBattle, target: FighterInBattle, tick: MidFightEvent[]): number {
    const distanceToMove = Math.max(2.5 + f.stats.speed / 2, 0) * TICK_LENGTH;
    let [deltaX, deltaY] = scaleVectorToMagnitude(f.x - target.x, f.y - target.y, distanceToMove);

    // if too close to the wall, change direction to be less close to the wall.
    if (f.x + deltaX < CROWDING_DISTANCE) {
      deltaX = Math.abs(deltaX);
    } else if (f.x + deltaX > 100 - CROWDING_DISTANCE) {
      deltaX = -Math.abs(deltaX);
    }
    if (f.y + deltaY < CROWDING_DISTANCE) {
      deltaY = Math.abs(deltaY);
      // being past the bottom of the screen is worse 
    } else if (f.y + deltaY > 100 - 2 * CROWDING_DISTANCE) {
      deltaY = -Math.abs(deltaY);
    }
    f.x += deltaX;
    f.y += deltaY;
    this.uncrowd(f);
    tick.push({
      type: "move",
      fighter: this.fighters.findIndex(f2 => f2 === f),
      x: Number(f.x.toFixed(2)),  // round to save data
      y: Number(f.y.toFixed(2))
    });
    return distanceToMove;
  }

  uncrowd(f: FighterInBattle): void {
    const tooClose = this.fighters.filter(f2 => f2.hp > 0 && distance(f, f2) <= CROWDING_DISTANCE);
    for (const f2 of tooClose) {
      // we double the x difference because we care more about crowding in the x direction
      const [deltaX, deltaY] = scaleVectorToMagnitude(2 * (f.x - f2.x), f.y - f2.y, CROWDING_DISTANCE - distance(f, f2));
      f.x += deltaX;
      f.y += deltaY;
      f.x = Math.min(Math.max(f.x, CROWDING_DISTANCE), 100 - CROWDING_DISTANCE);
      f.y = Math.min(Math.max(f.y, CROWDING_DISTANCE), 100 - CROWDING_DISTANCE);
    }
  }

  charge(f: FighterInBattle, tick: MidFightEvent[]): void {
    f.charge += 1;
    f.cooldown += Math.max(1.5, 9 - 0.6 * f.stats.energy);
    tick.push({
      type: "charge",
      fighter: this.fighters.indexOf(f),
      newCharge: f.charge
    });
  }

  doAction(f: FighterInBattle, a: Abilities, attuned: boolean, tick: MidFightEvent[]): void {
    const targets = this.targetsAffected(a.action.target, f);

    if (a.action.animation) {
      let flipped = false;
      if (targets.length >= 1) {
        flipped = targets[0].x > f.x;
      }
      tick.push({
        type: "animation",
        fighter: this.fighters.findIndex(f2 => f2 === f),
        animation: a.action.animation,
        flipped
      });
    }
    
    targets.forEach((t) => {
      // if the fighter has 0 accuracy, they have a 75% chance to miss. if they have 10 accuracy,
      // they have a 25% chance to miss.
      const missed = a.action.missable &&
          this.rng.randReal() < (15 - f.stats.accuracy) / 20;
      // the fighter being attacked has a 2% change to dodge for each point of speed they have.
      const dodged = a.action.dodgeable &&
          !missed &&
          this.rng.randReal() < Math.max(t.stats.speed / 50, 0.3);
      
      if (!missed && !dodged) {
        // trigger all the weapon's effects
        a.action.effects.forEach((effect) => {
          this.doEffect(
            effect,
            f,
            t,
            tick,
            attuned,
            a.action.target === Target.Melee,
            true
          );
        });

        // if the equipment has knockback, apply that much knockback
        // except it cannot send the fighter out of [5, 95] on either axis
        if (a.action.knockback) {
          const [unitVectorX, unitVectorY] = scaleVectorToMagnitude(t.x - f.x, t.y - f.y, 1);
          t.x += unitVectorX * a.action.knockback + 0.5 * (Math.random() - 0.5);
          t.y += unitVectorY * a.action.knockback + 0.5 * (Math.random() - 0.5);
          t.x = Math.max(Math.min(t.x, 100 - CROWDING_DISTANCE), CROWDING_DISTANCE);
          t.y = Math.max(Math.min(t.y, 100 - 2 * CROWDING_DISTANCE), CROWDING_DISTANCE);
          tick.push({
            type: "move",
            fighter: this.fighters.findIndex(z => z === t),
            x: Number(t.x.toFixed(2)),
            y: Number(t.y.toFixed(2))
          });
        }
      } else if (missed) {
        tick.push({
          type: "text",
          fighter: this.fighters.findIndex(t2 => t2 === t),
          text: "Missed"
        });
      } else if (dodged) {
        tick.push({
          type: "text",
          fighter: this.fighters.findIndex(t2 => t2 === t),
          text: "Dodged"
        });
      }
      if (a.action.projectileImg) {
        tick.push({
          type: "projectile",
          fighter: this.fighters.findIndex(f2 => f2 === f),
          target: this.fighters.findIndex(t2 => t2 === t),
          projectileImg: a.action.projectileImg
        });
      }
    });
    f.cooldown += a.action.cooldown;
  }

  doEffect(
    effect: Effect,
    fighter: FighterInBattle,
    target: FighterInBattle,
    tick: MidFightEvent[],
    attuned: boolean,
    melee: boolean,
    wasAction: boolean
  ): void {
    if (effect.type === "hpChange") {
      let amount = effect.amount;
      if (attuned) amount *= 1.25;
      amount = Math.min(amount, 100 - target.hp);
      target.hp += Math.round(amount);
      tick.push({
        type: "hpChange",
        fighter: this.fighters.findIndex(t2 => t2 === target),
        newHp: target.hp
      });
      tick.push({
        type: "text",
        fighter: this.fighters.findIndex(t2 => t2 === target),
        text: amount < 0.5 ? Math.round(-amount).toString() : "+" + Math.round(amount).toString()
      });
    } else if (effect.type === "damage") {
      let damage = effect.amount * (1.25 - target.stats.toughness / 20);
      if (attuned) damage *= 1.25;
      if (melee) damage *= 0.5 + fighter.stats.strength / 10;
      damage = Math.max(damage, 1);
      target.hp -= Math.round(damage);
      tick.push({
        type: "hpChange",
        fighter: this.fighters.findIndex(t2 => t2 === target),
        newHp: target.hp
      });
      tick.push({
        type: "text",
        fighter: this.fighters.findIndex(t2 => t2 === target),
        text: Math.round(damage).toString()
      });
    } else if (effect.type === "statChange") {
      const status = { ...effect };
      if (attuned) status.duration *= 1.25;
      target.statusEffects.push(status);
      target.stats[effect.stat] += effect.amount;
      if (effect.tint) {
        tick.push({
          type: "tint",
          fighter: this.fighters.findIndex(t2 => t2 === target),
          tint: effect.tint
        });
      }
    }

    // trigger related effects if appropriate
    if (effect.type === "damage" && wasAction) {
      // trigger all the fighter's equipment's hitDealt abilities
      fighter.equipment.forEach((e) => {
        (e.abilities.triggeredEffects || []).forEach((a) => {
          if (a.trigger === Trigger.HitDealt) {
            this.targetsAffected(a.target, fighter, target).forEach((f) => {
              this.doEffect(
                a,
                fighter,
                f,
                tick,
                fighter.attunements.includes(e.name),
                false,
                false
              );
            });
          }
        });
      });

      // trigger all the target's equipment's hitTaken abilities
      target.equipment.forEach((e) => {
        (e.abilities.triggeredEffects || []).forEach((a) => {
          if (a.trigger === Trigger.HitTaken) {
            this.targetsAffected(a.target, target, fighter).forEach((f) => {
              this.doEffect(
                a,
                target,
                f,
                tick,
                target.attunements.includes(e.name),
                false,
                false
              );
            });
          }
        });
      });
    }
  }

  targetsAffected(target: Target, fighter: FighterInBattle, actionTarget?: FighterInBattle): FighterInBattle[] {
    if (target === Target.Self) {
      return [fighter];
    } else if (target === Target.Melee || target === Target.NearestEnemy) {
      return this.enemies(fighter).length === 0 ? [] : [this.closestEnemy(fighter)];
    } else if (target === Target.AllEnemies) {
      return this.enemies(fighter);
    } else if (target === Target.AllTeammates) {
      return this.teammates(fighter);
    } else if (target === Target.RandomEnemy) {
      return this.enemies(fighter).length === 0 ? [] : [this.rng.randElement(this.enemies(fighter))];
    } else if (target === Target.AnyEnemy) {
      if (this.enemies(fighter).length === 0) {
        return [];
      }
      let bestTarget: FighterInBattle;
      let bestEngageability = -100000000;
      for (const f2 of this.enemies(fighter)) {
        let e2 = this.targetability(f2);
        if (e2 >= bestEngageability) {
          bestTarget = f2;
          bestEngageability = e2;
        }
      }
      return [bestTarget];
    } else if (target === Target.RandomTeammate) {
      return this.teammates(fighter).length === 0 ? [] : [this.rng.randElement(this.teammates(fighter))];
    } else if (target === Target.AnyTeammate) {
      if (this.teammates(fighter).length === 0) {
        return [];
      }
      let bestTarget: FighterInBattle;
      let bestBuffability = -100000000;
      for (const f2 of this.teammates(fighter)) {
        let e2 = buffability(f2);
        if (e2 >= bestBuffability) {
          bestTarget = f2;
          bestBuffability = e2;
        }
      }
      return [bestTarget];
    } else if (target === Target.ActionTarget) {
      return [actionTarget];
    } else {
      return [];
    }
  }

  // in battle royales, prioritize danger; in duels, prioritize danger + low HP
  targetability(fighter: FighterInBattle): number {
    const numberOfTeams = this.fighters.reduce((a, b) => Math.max(a, b.team), 0);
    return numberOfTeams > 2 ? engageabilityBR(fighter) : engageability(fighter);
  }

  teammates(fighter: FighterInBattle) {
    return this.fighters.filter(f => f.team === fighter.team && f.hp > 0);
  }

  enemies(fighter: FighterInBattle) {
    return this.fighters.filter(f => f.team !== fighter.team && f.hp > 0);
  }
}

// Calculate the Euclidean distance between two fighters in the x-y plane
function distance(f1: FighterInBattle, f2: FighterInBattle): number {
  return Math.sqrt(Math.pow(f1.x - f2.x, 2) + Math.pow(f1.y - f2.y, 2));
}

function scaleVectorToMagnitude(x: number, y: number, magnitude: number): [number, number] {
  const currentMagnitude = Math.max(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)), EPSILON);
  return [
    x / currentMagnitude * magnitude,
    y / currentMagnitude * magnitude
  ];
}

function engageability(f: FighterInBattle): number {
  const effectiveHp = f.hp * (0.75 + f.stats.toughness / 20) / (1 - f.stats.speed / 50);

  let bestActionDanger;
  let passiveDanger = 0;
  for (const e of (f.equipment as { abilities: Abilities }[]).concat(f, FISTS)) {
    bestActionDanger = Math.max(bestActionDanger, actionDanger(f, e.abilities));
    passiveDanger += e.abilities.aiHints.passiveDanger ?? 0;
  }
  // console.log("Name:", f.name, "| Danger:", (bestActionDanger || 0) + passiveDanger, "| Effective HP:", effectiveHp);

  return (50 + 20 * ((bestActionDanger || 0) + passiveDanger)) / (50 + effectiveHp);
}

// Prefer higher effective HP when prioritizing targets in battle royale
// Also make engageabliity way less important in general
export function engageabilityBR(f: FighterInBattle): number {
  const effectiveHp = f.hp * (0.75 + f.stats.toughness / 20) / (1 - f.stats.speed / 50);

  let bestActionDanger = 0;
  let passiveDanger = 0;
  for (const e of (f.equipment as { abilities: Abilities }[]).concat(f, FISTS)) {
    bestActionDanger = Math.max(bestActionDanger, actionDanger(f, e.abilities));
    passiveDanger += actionDanger(f, e.abilities);
  }

  return (10 + 4 * (bestActionDanger + passiveDanger)) / (150 - effectiveHp);
}

function buffability(f: FighterInBattle): number {
  const effectiveHp = f.hp * (0.75 + f.stats.toughness / 20) / (1 - f.stats.speed / 50);

  let bestActionDanger = 0;
  let passiveValue = 0;
  for (const e of (f.equipment as { abilities: Abilities }[]).concat(f, FISTS)) {
    bestActionDanger = Math.max(bestActionDanger, actionDanger(f, e.abilities));
    passiveValue += (e.abilities.aiHints.passiveDanger ?? 0) +
                    (e.abilities.aiHints.passiveValue ?? 0);
  }

  return (1 + 0.5 * (bestActionDanger + passiveValue)) / (150 - effectiveHp);
}

export function actionDanger(f: FighterInBattle, a: Abilities): number {
  let d = a.aiHints.actionDanger ?? 0;
  // if therer is a relevant stat (strength or accuracy), adjust by it
  if (a.aiHints.actionStat) {
    d *= 0.5 + 0.1 * f.stats[a.aiHints.actionStat];
  }
  // if it needs to charge, multiply based on how soon it will be charged, relevant to a fighter
  // with 0 charge and 0 energy
  if (a.action && a.action.chargeNeeded) {
    d *= 1 -
        (a.action.chargeNeeded - f.charge) *  // charges still needed
        (9 - 0.6 * f.stats.energy) /          // time per charge
        (9 * f.stats.energy);                 // time needed if 0 charge and 0 energy
  }
  return d;
}