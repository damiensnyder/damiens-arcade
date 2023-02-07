
import type { FighterInBattle, MFAnimationEvent, MFMoveEvent, MFTextEvent, MFSpawnEvent, MidFightEvent, MFTintEvent, MFProjectileEvent, MFHpChangeEvent } from "$lib/mayhem-manager/types";
import { ColorMatrixFilter } from "pixi.js";
import { watchingFight } from "./stores";

interface TextParticle {
  type: "text"
  x: number
  y: number
  text: string
  opacity: number
}

interface ImageParticle {
  type: "image"
  x: number
  y: number
  destX?: number
  destY?: number
  rotation?: number
  imgUrl: string
}

export type Particle = TextParticle | ImageParticle;

enum RotationState {
  Stationary1 = 0,
  Stationary2 = 0.1,
  WalkingStart1 = -8,
  Walking1 = -8.1,
  WalkingStart2 = 8,
  Walking2 = 8.1,
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
  hitFlash: number[];
  particles: Particle[];
  tint: [number, number, number, number][];
  nextFighters: FighterInBattle[];
  nextRotation: RotationState[];
  nextFlipped: boolean[];
  nextHitFlash: number[];
  nextParticles: Particle[];
  nextTint: [number, number, number, number][];

  constructor(eventLog: MidFightEvent[][]) {
    eventLog.splice(1, 0, [], [], [], [], []);  // pause for a second after spawning in fighters
    eventLog.push([], [], [], [], []);  // repeat an empty tick after the last tick
    this.eventLog = eventLog;
    this.tick = -1;
    this.fighters = [];
    this.rotation = [];
    this.flipped = [];
    this.hitFlash = [];
    this.particles = [];
    this.tint = [];
    this.nextFighters = [];
    this.nextRotation = [];
    this.nextFlipped = [];
    this.nextHitFlash = [];
    this.nextParticles = [];
    this.nextTint = [];
  }

  // Figure out what the next tick is going to look like so we can interpolate between the current
  // tick and the next one.
  prepareTick(): void {
    this.fighters = this.nextFighters.slice();
    this.rotation = this.nextRotation.slice();
    this.flipped = this.nextFlipped.slice();
    this.hitFlash = this.nextHitFlash.slice();
    this.particles = this.nextParticles.slice();
    this.tint = this.nextTint.slice();
    this.nextParticles = this.nextParticles.filter(p => p.type === "text" && p.opacity > 0.5)
        .map(p => { return { ...p, opacity: (p as TextParticle).opacity - 0.5 } });
    if (this.tick < this.eventLog.length - 1) {
      this.tick++;
    } else {
      // stop watching 1 second after the fight is over
      setTimeout(() => {
        watchingFight.set(false);
      }, 1000);
    }
    const nextTick = this.eventLog[this.tick];
    this.nextHitFlash = this.nextHitFlash.map(h => Math.max(h - 0.75, 0));

    if (this.tick < this.eventLog.length - 1) {
      for (let event of nextTick) {
        if (event.type === "spawn") {
          event = event as MFSpawnEvent;
          this.fighters.push(event.fighter);
          this.rotation.push(RotationState.Stationary1);
          this.flipped.push(false);
          this.hitFlash.push(0);
          this.tint.push([0, 0, 0, 0]);
          this.nextFighters.push(event.fighter);
          this.nextRotation.push(RotationState.Stationary1);
          this.nextFlipped.push(false);
          this.nextHitFlash.push(0);
          this.nextTint.push([0, 0, 0, 0]);
        } else if (event.type === "move") {
          event = event as MFMoveEvent;
          const f: number = event.fighter;
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
        } else if (event.type === "text" && event.text !== "0") {
          event = event as MFTextEvent;
          this.nextParticles.push({
            type: "text",
            text: event.text,
            x: this.nextFighters[event.fighter].x,
            y: this.nextFighters[event.fighter].y - 7,  // moved up to be just over the fighter's head
            opacity: 1
          });
        } else if (event.type === "projectile") {
          event = event as MFProjectileEvent;
          const f = this.fighters[event.fighter];
          const t = this.nextFighters[event.target];
          this.nextFlipped[event.fighter] = f.x > t.x;
          this.particles.push({
            type: "image",
            x: f.x,
            y: f.y,
            destX: t.x,
            destY: t.y,
            imgUrl: event.projectileImg
          });
        } else if (event.type === "hpChange") {
          event = event as MFHpChangeEvent;
          const f = this.fighters[event.fighter];
          this.nextFighters[event.fighter] = {
            ...f,
            hp: event.newHp
          };
          if (event.newHp < f.hp) {
            this.nextHitFlash[event.fighter] = 1;
          }
        } else if (event.type === "tint") {
          this.nextTint[event.fighter] = event.tint;
        }
      }
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

    // start animations 2 ticks in advance
    if (this.tick < this.eventLog.length - 2) {
      const tick2Away = this.eventLog[this.tick + 2];
      tick2Away.filter(e => e.type === "animation").forEach((e) => {
        e = e as MFAnimationEvent;
        if (e.animation === "swing") {
          this.nextRotation[e.fighter] = RotationState.BackswingStart;
        } else if (e.animation === "aim") {
          this.nextRotation[e.fighter] = RotationState.AimStart;
        }
      });
    }
  }

  // Fighters with correct coordinate interpolation
  getFighters(delta: number): FighterInBattle[] {
    return this.fighters.map((f1, i) => {
      const f2 = this.nextFighters[i];
      return {
        ...f1,
        x: f2.x * delta + f1.x * (1 - delta),
        y: f2.y * delta + f1.y * (1 - delta)
      };
    });
  }

  // Rotation with correct interpolation
  getRotation(delta: number): number[] {
    return this.rotation.map((r1, i) => {
      const r2 = this.nextRotation[i];
      return r2 * delta + r1 * (1 - delta);
    });
  }

  // Flippedness with correct interpolation
  getFlipped(delta: number): number[] {
    return this.flipped.map((f1, i) => {
      const f2 = this.nextFlipped[i];
      return (f2 ? 1 : -1) * delta + (f1 ? 1 : -1) * (1 - delta);
    });
  }

  // Hit flash with correct interpolation
  getTint(delta: number): ColorMatrixFilter[] {
    return this.hitFlash.map((h1, i) => {
      const h2 = this.nextHitFlash[i];
      const intensity = Math.min(h1, h2) * delta + h1 * (1 - delta);
      const tint = this.tint[i].slice();
      for (let j = 0; j < 4; j++) {
        tint[j] = this.nextTint[i][j] * delta + tint[j] * (1 - delta);
      }
      const filter = new ColorMatrixFilter();
      filter.matrix = [1 - tint[3], 0, 0, 0, intensity / 2 + tint[0] * tint[3],
                       0, 1 - tint[3], 0, 0, intensity / 2 + tint[1] * tint[3],
                       0, 0, 1 - tint[3], 0, intensity / 2 + tint[2] * tint[3],
                       0, 0, 0, 1, 0];
      return filter;
    });
  }

  // Particles with correct interpolation
  getParticles(delta: number): Particle[] {
    const projectiles: ImageParticle[] = this.particles.filter(p => p.type === "image")
        .map((p) => {
      p = p as ImageParticle;
      return {
        type: "image",
        x: p.destX * delta + p.x * (1 - delta),
        y: p.destY * delta + p.y * (1 - delta),
        rotation: -Math.atan2(p.destX - p.x, p.destY - p.y),
        imgUrl: p.imgUrl
      };
    });
    const text: TextParticle[] = this.particles.filter(p => p.type === "text")
        .map((p) => {
      p = p as TextParticle;
      return {
        type: "text",
        x: p.x,
        y: p.y,
        text: p.text,
        opacity: (p.opacity - 0.5) * delta + p.opacity * (1 - delta)
      };
    });
    return (projectiles as Particle[]).concat(text);
  }
}