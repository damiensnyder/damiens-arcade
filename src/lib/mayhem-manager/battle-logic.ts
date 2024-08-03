import { writeFileSync } from "fs";
import { EquipmentSlot, type Equipment, type MidFightEvent, type Team, type Fighter, type StatChangeEffect, type FighterStats, type Appearance, type EquipmentInBattle, RotationState, type Tint, type MFAnimationEvent } from "$lib/mayhem-manager/types";
import type { RNG } from "$lib/types";
import { getEquipmentForBattle, getFighterAbilityForBattle } from "./decks";

const DEBUG = false;
const CROWDING_DISTANCE = 3;  // at less than this distance, fighters repel
export const MELEE_RANGE = 4;  // at less than this distance, fighters repel
export const TICK_LENGTH = 0.2;  // length of a tick in seconds
export const EPSILON = 0.00001;  // to account for rounding errors
const INITIAL_COOLDOWN = 3;  // seconds of cooldown fighters start the battle with
const KNOCKBACK_ROTATION = Math.PI / 12;



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



export class FighterInBattle {
  team: number
  name: string
  description: string
  flavor: string
  experience: number
  hp: number
  x: number
  y: number
  cooldown: number
  charges: number
  stats: FighterStats
  appearance: Appearance
  attunements: string[]
  statusEffects: StatChangeEffect[]
  flash: number
  rotationState: RotationState
  fight?: Fight
  index?: number
  equipment: EquipmentInBattle[]

  constructor(fighter: Fighter, equipment: Equipment[], team: number) {
    this.team = team;
    this.name = fighter.name;
    this.description = fighter.description;
    this.flavor = fighter.flavor;
    this.experience = fighter.experience;
    this.hp = 100;
    this.x = 0;
    this.y = 0;
    this.cooldown = 3;
    this.charges = 0;
    this.stats = { ...fighter.stats };
    this.appearance = fighter.appearance;
    this.attunements = fighter.attunements;
    this.statusEffects = [];
    this.flash = 0;
    this.rotationState = RotationState.Stationary1;
    this.equipment = [
      fists(),
      getFighterAbilityForBattle(fighter.abilityName, this)
    ].concat(
      equipment.map(e => getEquipmentForBattle(e.abilityName, this))
    );
  }

  // decay or remove any temporary effects that were present at start of turn
  decayEffects(): void {
    if (this.flash > 0) {
      this.flash = Math.max(this.flash - 0.75, 0);
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          flash: this.flash
        }
      });
    }

    const oldTint = this.tint();
    this.statusEffects.forEach((s) => {
      s.duration -= TICK_LENGTH;
      if (s.duration <= 0) {
        this.stats[s.stat] -= s.amount;
      }
    });
    this.statusEffects = this.statusEffects.filter((s) => s.duration > 0);
    const newTint = this.tint();
    if (newTint.some((x, i) => x !== oldTint[i])) {
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

    if (this.hp <= 0) return;  // do nothing if fighter is down
    if (this.enemies().length === 0) return;  // do nothing if no enemies

    this.equipment.forEach((e) => {
      e.onTick?.(e);
    });
  }

  act(): void {
    if (this.hp <= 0) return;  // do nothing if fighter is down
    if (this.enemies().length === 0) return;  // do nothing if no enemies

    const positionAtStartOfTurn = [this.x, this.y];

    let bestAction: EquipmentInBattle;
    let bestActionPriority = -1;
    this.equipment.forEach((e) => {
      const actionPriority = e.getActionPriority?.(e) ?? 0;
      if (actionPriority > bestActionPriority) {
        bestAction = e;
        bestActionPriority = actionPriority;
      }
    });
    bestAction.whenPrioritized(bestAction);

    // return to stationary if not moving
    if (this.x === positionAtStartOfTurn[0] && this.y === positionAtStartOfTurn[1]) {
      this.rotationState = RotationState.Stationary1;
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: this.rotationState
        }
      });
    }
  }

  // merge the tints of all status effects
  tint(): Tint {
    let ret: Tint = [0, 0, 0, 0];
    for (let se of this.statusEffects) {
      if (se.tint) {
        if (ret.every(x => x === 0)) {
          ret = se.tint;
        } else {
          ret = ret.map((x, i) => x / 2 + se.tint[i] / 2) as Tint;
        }
      }
    }
    return ret;
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
    return Math.max(5 + 1 * this.stats.speed, 1);
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
    return Math.max(this.distanceTo(target) - MELEE_RANGE, 0) / this.speedInMetersPerSecond();
  }

  timeToAttack(target: FighterInBattle): number {
    return Math.max(
      this.cooldown,
      this.timeToReach(target)
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

  moveByVector(deltaX: number, deltaY: number, causeFlip: boolean = true): void {
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

    // go to next rotation state
    switch (this.rotationState) {
      case RotationState.Stationary1:
        this.rotationState = RotationState.WalkingStart1;
        break;
      case RotationState.WalkingStart1:
        this.rotationState = RotationState.Walking1;
        break;
      case RotationState.Walking1:
        this.rotationState = RotationState.Stationary2;
        break;
      case RotationState.Stationary2:
        this.rotationState = RotationState.WalkingStart2;
        break;
      case RotationState.WalkingStart2:
        this.rotationState = RotationState.Walking2;
        break;
      default:
        this.rotationState = RotationState.Stationary1;
    }

    this.logEvent({
      type: "animation",
      fighter: this.index,
      updates: {
        x: Number(this.x.toFixed(2)),
        y: Number(this.y.toFixed(2)),
        rotation: this.rotationState
      }
    });
    if (causeFlip) {
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          facing: deltaX > 0 ? -1 : 1
        }
      });
    }
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
    this.moveByVector(deltaX, deltaY);
  }

  moveAwayFrom(target: FighterInBattle): void {
    const distanceToMove = this.speedInMetersPerSecond() * TICK_LENGTH;
    let [deltaX, deltaY] = scaleVectorToMagnitude(this.x - target.x, this.y - target.y, distanceToMove);
    this.moveByVector(deltaX, deltaY, false);
  }

  attemptCharge(): void {
    this.charges += 1;
    this.cooldown = this.timeToCharge();
    this.logEvent({
      type: "particle",
      fighter: this.index,
      particleImg: "/static/charge.png"
    });
  }

  attemptMeleeAttack(target: FighterInBattle, damage: number, cooldown: number, knockback: number): void {
    if (this.distanceTo(target) > MELEE_RANGE && this.timeToAttack(target) > this.cooldown - 0.8) {
      this.moveTowards(target);
    } else if (this.timeToReach(target) < this.cooldown - 0.5) {
      this.moveAwayFrom(target);
    }
    if (this.distanceTo(target) < MELEE_RANGE && this.cooldown === 0) {
      damage *= target.damageTakenMultiplier();
      damage = Math.ceil(damage);
      target.hp -= damage;
      this.cooldown = cooldown;
      target.flash = 1;

      // do knockback
      let [deltaX, deltaY] = scaleVectorToMagnitude(target.x - this.x, target.y - this.y, knockback);
      const rotatedX = Math.cos(KNOCKBACK_ROTATION * deltaX) - Math.sin(KNOCKBACK_ROTATION * deltaY);
      const rotatedY = Math.sin(KNOCKBACK_ROTATION * deltaX) + Math.cos(KNOCKBACK_ROTATION * deltaY);
      target.moveByVector(rotatedX, rotatedY, false);

      // log the hit with animation info
      this.logEvent({
        type: "animation",
        fighter: target.index,
        updates: {
          hp: target.hp,
          flash: target.flash
        }
      });
      this.logEvent({
        type: "text",
        fighter: target.index,
        text: damage.toString()
      });
      this.logEvent({
        type: "particle",
        fighter: target.index,
        particleImg: "/static/damage.png"
      });
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: RotationState.BackswingStart
        }
      }, 2);
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: RotationState.Backswing
        }
      }, 1);
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: RotationState.ForwardSwing
        }
      });
      this.rotationState = RotationState.ForwardSwing;
    }
  }

  attemptRangedAttack(target: FighterInBattle, damage: number, cooldown: number, knockback: number, projectileImg: string): void {
    // run away if any enemy can reach this fighter before the cooldown ends
    const enemiesThatCanReachBeforeShot = this.enemies().filter((f) => f.timeToAttack(this) < this.cooldown);
    if (enemiesThatCanReachBeforeShot.length > 0) {
      this.moveAwayFrom(enemiesThatCanReachBeforeShot[0]);
    }
    if (this.cooldown === 0) {
      this.cooldown = cooldown;
      this.logEvent({
        type: "projectile",
        fighter: this.index,
        target: target.index,
        projectileImg
      });
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: RotationState.AimStart
        }
      }, 2);
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: RotationState.Aim
        }
      }, 1);
      this.logEvent({
        type: "animation",
        fighter: this.index,
        updates: {
          rotation: RotationState.ForwardSwing
        }
      });

      // do damage + animations if the attack hits
      if (this.fight.rng.randReal() < this.rangedHitChance()) {
        damage *= target.damageTakenMultiplier();
        damage = Math.ceil(damage);
        target.hp -= damage;
        target.flash = 1;

        // do knockback
        let [deltaX, deltaY] = scaleVectorToMagnitude(target.x - this.x, target.y - this.y, knockback);
        const rotatedX = Math.cos(KNOCKBACK_ROTATION * deltaX) - Math.sin(KNOCKBACK_ROTATION * deltaY);
        const rotatedY = Math.sin(KNOCKBACK_ROTATION * deltaX) + Math.cos(KNOCKBACK_ROTATION * deltaY);
        target.moveByVector(rotatedX, rotatedY, false);

        // log the hit with animation info
        this.logEvent({
          type: "animation",
          fighter: target.index,
          updates: {
            hp: target.hp,
            flash: target.flash
          }
        });
        this.logEvent({
          type: "text",
          fighter: target.index,
          text: damage.toString()
        });
        this.logEvent({
          type: "particle",
          fighter: target.index,
          particleImg: "/static/damage.png"
        });
      } else {
        this.logEvent({
          type: "text",
          fighter: target.index,
          text: "Missed"
        });
      }
    }
  }

  logEvent(event: MidFightEvent, ticksAgo: number = 0): void {
    const tick = this.fight.eventLog[this.fight.eventLog.length - 1 - ticksAgo];
    // if this is not an animation tick or this fighter doesn't have a previous animation tick,
    // just push to the tick like normal
    // otherwise, merge with the last animation tick (overwriting where conflicts exist)
    const animationEventForFighter = tick.filter(e => e.type === "animation" && event.type === "animation" && e.fighter === event.fighter);
    if (event.type === "animation" && animationEventForFighter.length > 0) {
      const existingEvent: MFAnimationEvent = animationEventForFighter[0] as MFAnimationEvent;
      existingEvent.updates = {
        ...existingEvent.updates,
        ...event.updates
      };
    } else {
      tick.push(event);
    }
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
    // place the fighters evenly spaced in a circle of radius 35 centered at (0, 0)
    this.fighters.forEach((f, i) => {
      const spawnTick: MidFightEvent[] = [];
      f.fight = this;
      f.index = i;
      f.x = 50 + -35 * Math.cos(2 * Math.PI * i / this.fighters.length);
      f.y = 50 + 35 * Math.sin(2 * Math.PI * i / this.fighters.length);
      f.equipment.forEach((e) => {
        e.fighter = f;
      });

      spawnTick.push({
        type: "spawn",
        fighter: {  // f will be mutated during the fight so we need a current snapshot
          name: f.name,
          description: f.description,
          flavor: f.flavor,
          experience: f.experience,
          stats: { ...f.stats },
          appearance: { ...f.appearance },
          equipment: f.equipment.map((e) => {
            return {
              name: e.name,
              imgUrl: e.imgUrl,
              slots: e.slots
            };
          }),
          hp: f.hp,
          x: Number(f.x.toFixed(2)),
          y: Number(f.y.toFixed(2)),
          facing: 1,
          tint: [0, 0, 0, 0],
          flash: 0,
          rotation: 0,
          team: f.team
        }
      });
      // add a little flair to the spawn with a particle effect
      spawnTick.push({
        type: "particle",
        fighter: i,
        particleImg: "/static/charge.png"
      });

      // pause 0.8 seconds between spawning fighters
      this.eventLog.push(spawnTick);
      for (let i = 0; i < 1 + Math.floor(11 / this.fighters.length); i++) {
        this.eventLog.push([]);
      }
    });
    for (let i = 0; i < 4; i++) {
      this.eventLog.push([]);
    }

    // do stat changes and set initial cooldowns
    this.fighters.forEach((f) => {
      f.cooldown = INITIAL_COOLDOWN;
      f.equipment.forEach(e => {
        e.onFightStart?.(e);
      });
    });

    while (!this.fightIsOver()) {
      this.doTick();
    }
  }

  doTick(): void {
    this.fighters.forEach(f => f.decayEffects());
    this.fighters.forEach(f => f.act());
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

    if (DEBUG) writeFileSync("logs/ticks.txt", JSON.stringify(this.eventLog));
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

function fists(): EquipmentInBattle {
  return {
    name: "Fists",
    slots: [],
    imgUrl: "",
    isFighterAbility: true,
    actionDanger: (self: EquipmentInBattle) => {
      return 5 * self.fighter.meleeDamageMultiplier();
    },
    getActionPriority: (self: EquipmentInBattle) => {
      const dps = 5 * self.fighter.meleeDamageMultiplier();
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        maxValue = Math.max(self.fighter.valueOfAttack(target, dps, self.fighter.timeToAttack(target)));
      }
      return maxValue;
    },
    whenPrioritized: (self: EquipmentInBattle) => {
      const dps = 5 * self.fighter.meleeDamageMultiplier();
      let bestTarget: FighterInBattle;
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        const value = self.fighter.valueOfAttack(target, dps, self.fighter.timeToAttack(target));
        if (bestTarget === undefined || value > maxValue) {
          bestTarget = target;
          maxValue = value;
        }
      }
      self.fighter.attemptMeleeAttack(bestTarget, 12 * self.fighter.meleeDamageMultiplier(), 2.4, 0.2);
    }
  }
}