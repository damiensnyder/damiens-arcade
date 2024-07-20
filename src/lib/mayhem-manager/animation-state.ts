
import type { MFAnimationEvent, MFTextEvent, MFSpawnEvent, MidFightEvent, MFParticleEvent, MFProjectileEvent, FighterVisual } from "$lib/mayhem-manager/types";
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

export default class AnimationState {
  eventLog: MidFightEvent[][];
  tick: number;
  fighters: FighterVisual[];
  charge: number[];
  hitFlash: number[];
  particles: Particle[];
  tint: [number, number, number, number][];
  nextFighters: FighterVisual[];
  nextCharge: number[];
  nextHitFlash: number[];
  nextParticles: Particle[];
  nextTint: [number, number, number, number][];

  constructor(eventLog: MidFightEvent[][]) {
    eventLog.push([], [], [], [], []);  // repeat an empty tick after the last tick
    this.eventLog = eventLog;
    this.tick = -1;
    this.fighters = [];
    this.charge = [];
    this.hitFlash = [];
    this.particles = [];
    this.tint = [];
    this.nextFighters = [];
    this.nextCharge = [];
    this.nextHitFlash = [];
    this.nextParticles = [];
    this.nextTint = [];
  }

  // Figure out what the next tick is going to look like so we can interpolate between the current
  // tick and the next one.
  prepareTick(): void {
    this.fighters = this.nextFighters.slice();
    this.charge = this.nextCharge.slice();
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
    this.nextCharge = this.nextCharge.map(c => Math.max(c - 0.2, 0));

    if (this.tick < this.eventLog.length - 1) {
      for (let event of nextTick) {
        if (event.type === "spawn") {
          event = event as MFSpawnEvent;
          this.fighters.push(event.fighter);
          this.charge.push(1);
          this.hitFlash.push(1);
          this.tint.push([0, 0, 0, 0]);
          this.nextFighters.push(event.fighter);
          this.nextCharge.push(1);
          this.nextHitFlash.push(1);
          this.nextTint.push([0, 0, 0, 0]);
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
          this.particles.push({
            type: "image",
            x: f.x,
            y: f.y,
            destX: t.x,
            destY: t.y,
            imgUrl: event.projectileImg
          });
        } else if (event.type === "animation") {
          event = event as MFAnimationEvent;
          this.nextFighters[event.fighter] = {
            ...this.nextFighters[event.fighter],
            ...event.updates
          }
        }
      }
    }
  }

  // Fighters with correct coordinate interpolation
  getFighters(delta: number): FighterVisual[] {
    return this.fighters.map((f1, i) => {
      const f2 = this.nextFighters[i];
      return {
        ...f1,
        x: f2.x * delta + f1.x * (1 - delta),
        y: f2.y * delta + f1.y * (1 - delta),
        facing: f2.facing * delta + f1.facing * (1 - delta),
        rotation: f2.rotation * delta + f1.rotation * (1 - delta)
      };
    });
  }

  // TODO: This should be part of getParticles
  getCharge(delta: number): number[] {
    return this.charge.map((c1, i) => {
      const c2 = this.nextCharge[i];
      return c2 * delta + c1 * (1 - delta);
    });
  }

  // TODO: This shouldn't be here anymore
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