import type {
	MFAnimationEvent,
	MFTextEvent,
	MFSpawnEvent,
	MidFightEvent,
	MFParticleEvent,
	MFProjectileEvent,
	FighterVisual,
	Tint
} from './types';
import { ColorMatrixFilter } from 'pixi.js';

interface TextParticle {
	type: 'text';
	x: number;
	y: number;
	text: string;
	opacity: number;
}

interface ProjectileParticle {
	type: 'projectile';
	x: number;
	y: number;
	destX?: number;
	destY?: number;
	rotation?: number;
	imgUrl: string;
}

export interface FighterParticle {
	type: 'fighter';
	fighter: number;
	imgUrl: string;
	opacity: number;
}

export type Particle = TextParticle | ProjectileParticle | FighterParticle;

export default class AnimationState {
	eventLog: MidFightEvent[][];
	tick: number;
	fighters: FighterVisual[];
	particles: Particle[];
	nextFighters: FighterVisual[];
	nextParticles: Particle[];
	fightOver: boolean;

	constructor(eventLog: MidFightEvent[][]) {
		eventLog.push([], [], [], [], []); // repeat an empty tick after the last tick
		this.eventLog = eventLog;
		this.tick = -1;
		this.fighters = [];
		this.particles = [];
		this.nextFighters = [];
		this.nextParticles = [];
		this.fightOver = false;
	}

	// Figure out what the next tick is going to look like so we can interpolate between the current
	// tick and the next one.
	prepareTick(): void {
		this.fighters = this.nextFighters.slice();
		this.particles = this.nextParticles.slice();
		const temp = [];
		for (let p of this.nextParticles) {
			if (p.type === 'text' && p.opacity > 0.5) {
				temp.push({
					...p,
					opacity: p.opacity - 0.5
				});
			} else if (p.type === 'fighter' && p.opacity > 0.2) {
				temp.push({
					...p,
					opacity: p.opacity - 0.2
				});
			}
		}
		this.nextParticles = temp;
		if (this.tick < this.eventLog.length - 1) {
			this.tick++;
		} else {
			// Mark fight as over - the component will handle stopping
			this.fightOver = true;
		}
		const nextTick = this.eventLog[this.tick];

		if (this.tick < this.eventLog.length - 1) {
			for (let event of nextTick) {
				if (event.type === 'spawn') {
					event = event as MFSpawnEvent;
					this.fighters.push(event.fighter);
					this.nextFighters.push(event.fighter);
				} else if (event.type === 'text' && event.text !== '0') {
					event = event as MFTextEvent;
					this.nextParticles.push({
						type: 'text',
						text: event.text,
						x: this.nextFighters[event.fighter].x,
						y: this.nextFighters[event.fighter].y - 7, // moved up to be just over the fighter's head
						opacity: 1
					});
				} else if (event.type === 'projectile') {
					event = event as MFProjectileEvent;
					const f = this.fighters[event.fighter];
					const t = this.nextFighters[event.target];
					this.particles.push({
						type: 'projectile',
						x: f.x,
						y: f.y,
						destX: t.x,
						destY: t.y,
						imgUrl: event.projectileImg
					});
				} else if (event.type === 'particle') {
					event = event as MFParticleEvent;
					this.particles.push({
						type: 'fighter',
						fighter: event.fighter,
						imgUrl: event.particleImg,
						opacity: 1
					});
					this.nextParticles.push({
						type: 'fighter',
						fighter: event.fighter,
						imgUrl: event.particleImg,
						opacity: 0.8
					});
				} else if (event.type === 'animation') {
					event = event as MFAnimationEvent;
					this.nextFighters[event.fighter] = {
						...this.nextFighters[event.fighter],
						...event.updates
					};
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
				rotation: f2.rotation * delta + f1.rotation * (1 - delta),
				tint: this.interpolateTint(f1.tint, f2.tint, delta),
				flash: Math.min(f1.flash, f2.flash) * delta + f1.flash * (1 - delta) // diff interpolation to be more sudden
			};
		});
	}

	interpolateTint(tint1: Tint, tint2: Tint, delta: number): Tint {
		if (tint1.every((x) => x === 0)) {
			return tint1;
		}
		const tint: number[] = [];
		for (let j = 0; j < 4; j++) {
			tint.push(tint2[j] * delta + tint1[j] * (1 - delta));
		}
		return tint as Tint;
	}

	// Particles with correct interpolation
	getParticles(delta: number): Particle[] {
		const projectiles: ProjectileParticle[] = this.particles
			.filter((p) => p.type === 'projectile')
			.map((p) => {
				p = p as ProjectileParticle;
				return {
					type: 'projectile',
					x: p.destX * delta + p.x * (1 - delta),
					y: p.destY * delta + p.y * (1 - delta),
					rotation: -Math.atan2(p.destX - p.x, p.destY - p.y),
					imgUrl: p.imgUrl
				};
			});
		const text: TextParticle[] = this.particles
			.filter((p) => p.type === 'text')
			.map((p) => {
				p = p as TextParticle;
				return {
					type: 'text',
					x: p.x,
					y: p.y,
					text: p.text,
					opacity: (p.opacity - 0.5) * delta + p.opacity * (1 - delta)
				};
			});
		const images: FighterParticle[] = this.particles
			.filter((p) => p.type === 'fighter')
			.map((p) => {
				p = p as FighterParticle;
				return {
					type: 'fighter',
					fighter: p.fighter,
					imgUrl: p.imgUrl,
					opacity: (p.opacity - 0.2) * delta + p.opacity * (1 - delta)
				};
			});
		return (projectiles as Particle[]).concat(text).concat(images);
	}
}

export function getColorFilters(tint: Tint, flash: number): [ColorMatrixFilter] {
	const filter = new ColorMatrixFilter();
	filter.matrix = [
		1 - tint[3],
		0,
		0,
		0,
		flash / 2 + tint[0] * tint[3],
		0,
		1 - tint[3],
		0,
		0,
		flash / 2 + tint[1] * tint[3],
		0,
		0,
		1 - tint[3],
		0,
		flash / 2 + tint[2] * tint[3],
		0,
		0,
		0,
		1,
		0
	];
	return [filter];
}
