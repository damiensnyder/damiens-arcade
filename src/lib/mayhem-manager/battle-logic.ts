import { readFileSync, writeFileSync } from "fs";
import { EquipmentSlot, type Equipment, type MidFightEvent, type Team, type MayhemManagerEvent, type Fighter, type StatChangeEffect, type FighterStats, type Appearance, type EquipmentInBattle } from "$lib/mayhem-manager/types";
import type { RNG } from "$lib/types";
import { getEquipmentForBattle, getFighterAbilityForBattle } from "./decks";

const DEBUG = false;
const CROWDING_DISTANCE = 3;  // at less than this distance, fighters repel
export const MELEE_RANGE = 4;  // at less than this distance, fighters repel
export const TICK_LENGTH = 0.2;  // length of a tick in seconds
export const EPSILON = 0.00001;  // to account for rounding errors
const FISTS: EquipmentInBattle = {
  name: "Fists",
  slots: [],
  imgUrl: "",
  isFighterAbility: true,
  actionDanger: (self: EquipmentInBattle) => {
    return 2 * self.fighter.meleeDamageMultiplier();
  },
  getActionPriority: (self: EquipmentInBattle) => {
    const dps = 2 * self.fighter.meleeDamageMultiplier();
    let maxValue = 0;
    for (let target of self.fighter.enemies()) {
      maxValue = Math.max(self.fighter.valueOfAttack(target, dps, self.fighter.timeToReach(target)));
    }
    return maxValue;
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



export class FighterInBattle {
  team: number
  name: string
  description: string
  flavor: string
  hp: number
  x: number
  y: number
  cooldown: number
  charge: number
  stats: FighterStats
  appearance: Appearance
  attunements: string[]
  statusEffects: StatChangeEffect[]
  fight?: Fight
  index?: number
  equipment: EquipmentInBattle[]

  constructor(fighter: Fighter, equipment: Equipment[], team: number) {
    this.team = team;
    this.name = fighter.name;
    this.description = fighter.description;
    this.flavor = fighter.flavor;
    this.hp = 100;
    this.x = 0;
    this.y = 0;
    this.cooldown = 3;
    this.charge = 0;
    this.stats = fighter.stats;
    this.appearance = fighter.appearance;
    this.attunements = fighter.attunements;
    this.statusEffects = [];
    this.equipment = [
      FISTS,
      getFighterAbilityForBattle(fighter.abilityName, this)
    ].concat(
      equipment.map(e => getEquipmentForBattle(e.abilityName, this))
    );
  }

  doTick(): void {
    if (this.hp <= 0) return;  // do nothing if fighter is down
    if (this.enemies().length === 0) return;  // do nothing if no enemies

    let bestAction: EquipmentInBattle;
    let bestActionPriority = 0;

    this.equipment.forEach((e) => {
      const actionPriority = e.getActionPriority?.(e) ?? 0;
      if (actionPriority > bestActionPriority) {
        bestAction = e;
        bestActionPriority = actionPriority;
      }
    });

    bestAction.whenPrioritized(bestAction);

    // tick down status effects, and end them if they're done
    let prevTint = [0, 0, 0, 0];
    let newTint: [number, number, number, number] = [0, 0, 0, 0];
    this.statusEffects.forEach((s) => {
      s.duration -= TICK_LENGTH;
      if (s.tint) {
        prevTint = s.tint;
        if (s.duration > 0) {
          newTint = s.tint;
        }
      }
      if (s.duration <= 0) {
        this.stats[s.stat] -= s.amount;
      }
    });
    // TODO: not sure all this is being logged
    this.statusEffects = this.statusEffects.filter((s) => s.duration > 0);
    if (!newTint.every((v, i) => v === prevTint[i])) {
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          tint: newTint
        }
      });
    }

    this.cooldown -= TICK_LENGTH;
    if (this.cooldown < EPSILON) this.cooldown = 0;
  }

  distanceTo(f: FighterInBattle): number {
    return Math.sqrt((this.x - f.x) ** 2 + (this.y - f.y) ** 2);
  }

  teammates(): FighterInBattle[] {
    return this.fight.fighters.filter(f => f.team === this.team && f.hp > 0);
  }

  enemies(): FighterInBattle[] {
    return this.fight.fighters.filter(f => f.team !== this.team && f.hp > 0);
  }

  meleeDamageMultiplier(): number {
    // cannot have less than 25% multiplier
    return Math.max(0.5 + 0.1 * this.stats.strength, 0.25);
  }

  rangedHitChance(): number {
    // hit chance must be between 0% and 100%
    return Math.max(0, 
      Math.min(0.25 + 0.05 * this.stats.accuracy, 1)
    );
  }

  speedInMetersPerSecond(): number {
    // cannot move slower than 1 m/s
    return Math.max(3 + 0.6 * this.stats.speed, 1);
  }

  timeToCharge(): number {
    // cannot charge faster than 1s
    return Math.max(6 - 0.4 * this.stats.energy, 1);
  }

  damageTakenMultiplier(): number {
    // cannot reduce incoming damage by more than 50%
    return Math.max(1.25 - 0.05 * this.stats.toughness, 0.5);
  }

  effectiveHp(): number {
    // cannot reduce incoming damage by more than 50%
    return this.hp / this.damageTakenMultiplier();
  }

  timeToReach(target: FighterInBattle): number {
    return Math.max(
      this.cooldown,
      this.distanceTo(target) / this.speedInMetersPerSecond()
    );
  }

  valueOfAttack(target: FighterInBattle, dps: number, timeUntilFirst: number): number {
    return target.fighterDanger() / (timeUntilFirst + (target.effectiveHp() / dps));
  }
  
  fighterDanger(): number {
    let bestActionDanger = 0;
    let passiveDanger = 0;
    for (let e of this.equipment) {
      if (e.actionDanger) {
        bestActionDanger = Math.max(bestActionDanger, e.actionDanger(e));
      }
      if (e.passiveDanger) {
        passiveDanger += e.passiveDanger(e);
      }
    }
    return bestActionDanger + passiveDanger;
  }

  moveTowards(target: FighterInBattle): void {
    const distanceToMove = Math.max(
      Math.min(
        this.speedInMetersPerSecond() * TICK_LENGTH,
        this.distanceTo(target) - CROWDING_DISTANCE
      ),
      0
    );
    let [deltaX, deltaY] = scaleVectorToMagnitude(target.x - this.x, target.y - this.y, distanceToMove);

    // if too close to the wall, change direction to be less close to the wall.
    if (this.x + deltaX < CROWDING_DISTANCE) {
      deltaX = Math.abs(deltaX);
    } else if (this.x + deltaX > 100 - CROWDING_DISTANCE) {
      deltaX = -Math.abs(deltaX);
    }
    if (this.y + deltaY < CROWDING_DISTANCE) {
      deltaY = Math.abs(deltaY);
      // being past the bottom of the screen is worse 
    } else if (this.y + deltaY > 100 - CROWDING_DISTANCE) {
      deltaY = -Math.abs(deltaY);
    }
    this.x += deltaX;
    this.y += deltaY;
    this.fight.uncrowd(this);

    // TODO: also log the fighter's rotation change
    this.logEvent({
      type: "animation",
      fighter: this.index,
      updates: {
        x: this.x,
        y: this.y,
        facing: deltaX > 0
      }
    });
  }

  moveAwayFrom(target: FighterInBattle): void {
    const distanceToMove = this.speedInMetersPerSecond() * TICK_LENGTH;
    let [deltaX, deltaY] = scaleVectorToMagnitude(this.x - target.x, this.y - target.y, distanceToMove);

    // if too close to the wall, change direction to be less close to the wall.
    if (this.x + deltaX < CROWDING_DISTANCE) {
      deltaX = Math.abs(deltaX);
    } else if (this.x + deltaX > 100 - CROWDING_DISTANCE) {
      deltaX = -Math.abs(deltaX);
    }
    if (this.y + deltaY < CROWDING_DISTANCE) {
      deltaY = Math.abs(deltaY);
      // being past the bottom of the screen is worse 
    } else if (this.y + deltaY > 100 - 2 * CROWDING_DISTANCE) {
      deltaY = -Math.abs(deltaY);
    }
    this.x += deltaX;
    this.y += deltaY;
    this.fight.uncrowd(this);

    // TODO: also log the fighter's rotation change
    this.logEvent({
      type: "animation",
      fighter: this.index,
      updates: {
        x: this.x,
        y: this.y,
        facing: deltaX > 0
      }
    });
  }

  attemptMeleeAttack(target: FighterInBattle, damage: number): void {
    if (this.distanceTo(target) > MELEE_RANGE && this.timeToReach(target) > this.cooldown - 0.8) {
      this.moveTowards(target);
    } else if (this.timeToReach(target) < this.cooldown - 0.8) {
      this.moveAwayFrom(target);
    }
    if (this.distanceTo(target) < MELEE_RANGE && this.cooldown === 0) {
      damage *= target.damageTakenMultiplier();
      damage = Math.round(damage);
      target.hp -= damage;
      this.logEvent({
        type: "animation",
        fighter: target.index,
        updates: {
          hp: target.hp
        }
      });
      this.logEvent({
        type: "text",
        fighter: target.index,
        text: damage.toString()
      });
      // TODO: log hit flash
    }
  }

  // TODO: combine this with the fighter's first animation event in the same tick, if one exists
  logEvent(event: MidFightEvent, ticksAgo: number = 0): void {
    this.fight.eventLog[this.fight.eventLog.length - 1 - ticksAgo].push(event);
  }
}



export class Fight {
  rng: RNG
  fighters: FighterInBattle[]
  eventLog: MidFightEvent[][]
  placementOrder: number[]

  constructor(
    rng: RNG,
    fighters: FighterInBattle[]
  ) {
    this.rng = rng;
    this.fighters = fighters;
    this.eventLog = [];
    this.placementOrder = [];
  }

  // Simulates the fight
  simulate(): void {
    // clear tick log file
    if (DEBUG) writeFileSync("logs/ticks.txt", "");

    // place the fighters evenly spaced in a circle of radius 25 centered at (0, 0)
    this.fighters.forEach((f, i) => {
      const spawnTick: MidFightEvent[] = [];
      f.fight = this;
      f.x = 50 + -25 * Math.cos(2 * Math.PI * i / this.fighters.length);
      f.y = 50 + 25 * Math.sin(2 * Math.PI * i / this.fighters.length);

      spawnTick.push({
        type: "spawn",
        fighter: {  // f will be mutated during the fight so we need a current snapshot
          name: f.name,
          description: f.description,
          flavor: f.flavor,
          stats: { ...f.stats },
          appearance: { ...f.appearance },
          equipment: { ...f.equipment },
          hp: f.hp,
          x: Number(f.x.toFixed(2)),
          y: Number(f.y.toFixed(2)),
          facing: 1,
          tint: [0, 0, 0, 0],
          rotation: 0,
          team: f.team
        }
      });
      // pause 0.8 seconds between spawning fighters
      this.eventLog.push(spawnTick);
      if (DEBUG) writeFileSync("logs/ticks.txt", JSON.stringify(spawnTick) + "[][][]", { flag: "a+" });
      for (let i = 0; i < 3; i++) {
        this.eventLog.push([]);
      }
    });
    if (DEBUG) writeFileSync("logs/ticks.txt", "[][][]", { flag: "a+" });
    for (let i = 0; i < 4; i++) {
      this.eventLog.push([]);
    }

    // do stat changes
    this.fighters.forEach((f) => {
      f.equipment.forEach(e => {
        e.onFightStart?.bind(e)();
      });
    });

    while (!this.fightIsOver()) {
      this.doTick();
    }
  }

  doTick(): void {
    this.fighters.forEach(f => f.doTick());
    
    // we stringify the tick so later mutations don't mess up earlier ticks
    if (DEBUG) writeFileSync("logs/ticks.txt", JSON.stringify(this.eventLog[this.eventLog.length - 1]), { flag: "a+" });
    this.eventLog.push([]);
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
    if (this.eventLog.length * TICK_LENGTH > 300) {
      while (teamsRemaining.length > 0) {
        this.placementOrder.unshift(teamsRemaining.pop());
      }
    }

    return teamsRemaining.length <= 1;
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