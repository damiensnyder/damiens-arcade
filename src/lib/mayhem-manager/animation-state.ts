
import type { FighterInBattle, MFMeleeAttackEvent, MFMoveEvent, MFRangedAttackEvent, MFSpawnEvent, MidFightEvent } from "$lib/mayhem-manager/types";

interface TextParticle {
  fighter: number
  text: string
  opacity: number
}

interface ImageParticle {
  x: number
  y: number
  rotation: number
  imgUrl: string
  done: boolean
}

enum RotationState {
  Stationary1 = 0,
  Stationary2 = 0.1,
  WalkingStart1 = -10,
  Walking1 = -10.1,
  WalkingStart2 = 10,
  Walking2 = 10.1,
  BackswingStart = -11.1,
  Backswing = -11,
  ForwardSwing = 30,
  AimStart = -5,
  Aim = -7
}

export default class AnimationState {
  eventLog: MidFightEvent[][];
  tick: number;
  fighters: FighterInBattle[];
  rotation: RotationState[];
  flipped: boolean[];
  hitFlashIntensity: number[];
  textParticles: TextParticle[];
  imageParticles: ImageParticle[];
  nextFighters: FighterInBattle[];
  nextRotation: RotationState[];
  nextFlipped: boolean[];
  nextHitFlashIntensity: number[];
  nextTextParticles: TextParticle[];
  nextImageParticles: ImageParticle[];

  constructor(eventLog: MidFightEvent[][]) {
    this.eventLog = eventLog;
    this.tick = -1;
    this.fighters = [];
    this.rotation = [];
    this.flipped = [];
    this.hitFlashIntensity = [];
    this.textParticles = [];
    this.imageParticles = [];
    this.nextFighters = [];
    this.nextRotation = [];
    this.nextFlipped = [];
    this.nextHitFlashIntensity = [];
    this.nextTextParticles = [];
    this.nextImageParticles = [];
  }

  prepareTick(): void {
    this.fighters = this.nextFighters.slice();
    this.rotation = this.nextRotation.slice();
    this.flipped = this.nextFlipped.slice();
    this.hitFlashIntensity = this.nextHitFlashIntensity.slice();
    this.textParticles = this.nextTextParticles.slice();
    this.imageParticles = this.nextImageParticles.slice();
    if (this.tick < this.eventLog.length - 1) {
      this.tick++;
    }
    const nextTick = this.eventLog[this.tick];
    this.nextHitFlashIntensity = this.nextHitFlashIntensity.map(i => Math.min(i - 0.5, 0));
    for (let event of nextTick) {
      if (event.type === "spawn") {
        event = event as MFSpawnEvent
        this.nextFighters.push(event.fighter);
        this.rotation.push(RotationState.Stationary1);
        this.flipped.push(false);
        this.hitFlashIntensity.push(0);
      } else if (event.type === "move") {
        event = event as MFMoveEvent;
        const f: number = event.fighter;
        this.nextFlipped[f] = event.x > this.nextFighters[f].x;
        this.nextFighters[f] = {
          ...this.nextFighters[f],
          x: event.x,
          y: event.y
        };
        if (f < this.rotation.length) {
          const prevRotation = this.rotation[event.fighter];
          if (prevRotation === RotationState.Stationary1) {
            this.nextRotation[f] = RotationState.WalkingStart1;
          } else if (prevRotation === RotationState.WalkingStart1) {
            this.nextRotation[f] = RotationState.Walking1;
          } else if (prevRotation === RotationState.Walking1) {
            this.nextRotation[f] = RotationState.Stationary2;
          } else if (prevRotation === RotationState.Stationary2) {
            this.nextRotation[f] = RotationState.WalkingStart2;
          } else if (prevRotation === RotationState.WalkingStart2) {
            this.nextRotation[f] = RotationState.Walking2;
          } else if (prevRotation === RotationState.Walking2 ||
              prevRotation === RotationState.ForwardSwing ||
              prevRotation === RotationState.Aim) {
            this.nextRotation[f] = RotationState.Stationary1;
          }
        }
      } else if (event.type === "meleeAttack") {
        event = event as MFMeleeAttackEvent;
        const f: number = event.fighter;
        const t: number = event.target;
        this.nextRotation[f] = RotationState.ForwardSwing;
        this.nextFighters[t] = {
          ...this.nextFighters[t],
          hp: this.nextFighters[t].hp - event.damage
        }
        this.nextParticles.push({
          type: "text",
          text: event.dodged ? "Dodged" : event.damage.toString(),
          fighter: event.target,
          opacity: 1
        });
        if (!event.dodged) this.nextHitFlashIntensity[t] = 1;
      } else if (event.type === "rangedAttack") {
        event = event as MFRangedAttackEvent;
        const f = this.fighters[event.fighter];
        const t = this.nextFighters[event.target];
        this.imageParticles.push({
          imgUrl: event.projectileImg,
          rotation: Math.atan2(t.x - f.x, t.y - f.y),
          x: f.x,
          y: f.y,
          done: false
        });
        this.nextImageParticles.push({
          imgUrl: event.projectileImg,
          rotation: Math.atan2(t.x - f.x, t.y - f.y),
          x: t.x,
          y: t.y,
          done: true
        });
        this.nextTextParticles.push({
          type: "text",
          text: event.missed ? "Missed" : event.damage.toString(),
          fighter: event.target,
          opacity: 1
        });
        if (!event.missed) this.nextHitFlashIntensity[event.target] = 1;
      }

      // cycle through attack animation if in one
      this.nextRotation = this.nextRotation.map((r) => {
        if (r === RotationState.BackswingStart) {
          return RotationState.Backswing;
        } else if (r === RotationState.AimStart) {
          return RotationState.Aim
        } else if (r === RotationState.Backswing) {
          return RotationState.ForwardSwing;
        } else if (r === RotationState.ForwardSwing ||
            r === RotationState.Aim) {
          return RotationState.Stationary1;
        }
        return r;
      });
    }
    // start animations for swings and aiming 2 ticks in advance
    if (this.tick < this.eventLog.length - 2) {
      const tick2Away = this.eventLog[this.tick + 2];
      tick2Away.filter(e => e.type === "meleeAttack").forEach((e) => {
        e = e as MFMeleeAttackEvent;
        this.nextRotation[e.fighter] = RotationState.BackswingStart;
      });
      tick2Away.filter(e => e.type === "rangedAttack").forEach((e) => {
        e = e as MFRangedAttackEvent;
        this.nextRotation[e.fighter] = RotationState.AimStart;
      });
    }
  }
}