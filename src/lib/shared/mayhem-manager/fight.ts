import { writeFileSync } from 'fs';
import { type MidFightEvent } from './types';
import type { RNG } from '../common/types';
import { FighterInBattle } from './fighter-in-battle';

export const DEBUG = false;
export const CROWDING_DISTANCE = 3; // at less than this distance, fighters repel
export const MELEE_RANGE = 4; // at less than this distance, fighters repel
export const TICK_LENGTH = 0.2; // length of a tick in seconds
export const EPSILON = 0.00001; // to account for rounding errors
export const INITIAL_COOLDOWN = 3; // seconds of cooldown fighters start the battle with
export const KNOCKBACK_ROTATION = Math.PI / 12;

export class Fight {
	rng: RNG;
	fighters: FighterInBattle[];
	eventLog: MidFightEvent[][];
	placementOrder: number[];

	constructor(rng: RNG, fighters: FighterInBattle[]) {
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
			f.x = 50 + -35 * Math.cos((2 * Math.PI * i) / this.fighters.length);
			f.y = 50 + 35 * Math.sin((2 * Math.PI * i) / this.fighters.length);
			f.equipment.forEach((e) => {
				e.fighter = f;
			});

			spawnTick.push({
				type: 'spawn',
				fighter: {
					// f will be mutated during the fight so we need a current snapshot
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
				type: 'particle',
				fighter: i,
				particleImg: '/static/charge.png'
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
			f.equipment.forEach((e) => {
				e.onFightStart?.(e);
			});
		});

		while (!this.fightIsOver()) {
			this.doTick();
		}
	}

	doTick(): void {
		this.fighters.forEach((f) => f.decayEffects());
		this.fighters.forEach((f) => f.act());
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
				this.placementOrder.unshift(teamsRemaining.pop()!);
			}
		}

		if (DEBUG) writeFileSync('logs/ticks.txt', JSON.stringify(this.eventLog));
		return teamsRemaining.length <= 1;
	}

	uncrowd(f: FighterInBattle): void {
		const tooClose = this.fighters.filter(
			(f2) => f2.hp > 0 && distance(f, f2) <= CROWDING_DISTANCE
		);
		for (const f2 of tooClose) {
			// we double the x difference because we care more about crowding in the x direction
			const [deltaX, deltaY] = scaleVectorToMagnitude(
				2 * (f.x - f2.x),
				f.y - f2.y,
				CROWDING_DISTANCE - distance(f, f2)
			);
			f.x += deltaX;
			f.y += deltaY;
			f.x = Math.min(Math.max(f.x, CROWDING_DISTANCE), 100 - CROWDING_DISTANCE);
			f.y = Math.min(Math.max(f.y, CROWDING_DISTANCE), 100 - CROWDING_DISTANCE);
		}
	}
}

// Calculate the Euclidean distance between two fighters in the x-y plane
export function distance(f1: FighterInBattle, f2: FighterInBattle): number {
	return Math.sqrt(Math.pow(f1.x - f2.x, 2) + Math.pow(f1.y - f2.y, 2));
}

export function scaleVectorToMagnitude(
	x: number,
	y: number,
	magnitude: number
): [number, number] {
	const currentMagnitude = Math.max(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)), EPSILON);
	return [(x / currentMagnitude) * magnitude, (y / currentMagnitude) * magnitude];
}
