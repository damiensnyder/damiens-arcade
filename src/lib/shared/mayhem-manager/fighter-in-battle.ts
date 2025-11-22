import {
	Fight,
	TICK_LENGTH,
	EPSILON,
	MELEE_RANGE,
	CROWDING_DISTANCE,
	KNOCKBACK_ROTATION,
	scaleVectorToMagnitude
} from './fight';
import { getFighterAbilityForBattle, getEquipmentForBattle } from './create-from-catalogs';
import {
	FighterStats,
	Appearance,
	StatusEffect,
	RotationState,
	EquipmentInBattle,
	Fighter,
	Equipment,
	Tint,
	MidFightEvent,
	MFAnimationEvent
} from './types';

export class FighterInBattle {
	team: number;
	name: string;
	description: string;
	flavor: string;
	experience: number;
	hp: number;
	x: number;
	y: number;
	cooldown: number;
	charges: number;
	stats: FighterStats;
	appearance: Appearance;
	attunements: string[];
	statusEffects: StatusEffect[];
	flash: number;
	rotationState: RotationState;
	fight?: Fight;
	index?: number;
	equipment: EquipmentInBattle[];

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
		this.equipment = [fists(), getFighterAbilityForBattle(fighter.abilityName, this)].concat(
			equipment.map((e) => getEquipmentForBattle(e.abilityName, this))
		);
	}

	// decay or remove any temporary effects that were present at start of turn
	decayEffects(): void {
		if (this.flash > 0) {
			this.flash = Math.max(this.flash - 0.75, 0);
			this.logEvent({
				type: 'animation',
				fighter: this.index!,
				updates: {
					flash: this.flash
				}
			});
		}

		const oldTint = this.tint();
		this.statusEffects.forEach((s) => {
			s.duration -= TICK_LENGTH;
			if (s.duration <= 0) {
				s.onClear(this);
			}
		});
		this.statusEffects = this.statusEffects.filter((s) => s.duration > 0);
		const newTint = this.tint();
		if (newTint.some((x, i) => x !== oldTint[i])) {
			this.logEvent({
				type: 'animation',
				fighter: this.index!,
				updates: {
					stats: this.stats,
					tint: newTint
				}
			});
		}

		if (this.statusEffects.some((s) => s.name === 'frozen')) {
			this.cooldown -= TICK_LENGTH / 2;
		} else {
			this.cooldown -= TICK_LENGTH;
		}
		if (this.cooldown < EPSILON) this.cooldown = 0;

		if (this.hp <= 0) return; // do nothing if fighter is down
		if (this.enemies().length === 0) return; // do nothing if no enemies

		this.equipment.forEach((e) => {
			e.onTick?.(e);
		});
	}

	act(): void {
		if (this.hp <= 0) return; // do nothing if fighter is down
		if (this.enemies().length === 0) return; // do nothing if no enemies

		const positionAtStartOfTurn = [this.x, this.y];

		let bestAction: EquipmentInBattle;
		let bestActionPriority: number;
		this.equipment.forEach((e) => {
			if (e.getActionPriority !== undefined) {
				const actionPriority = e.getActionPriority(e);
				if (actionPriority > bestActionPriority || bestAction === undefined) {
					bestAction = e;
					bestActionPriority = actionPriority;
				}
			}
		});
		bestAction!.whenPrioritized!(bestAction!);

		// return to stationary if not moving
		if (this.x === positionAtStartOfTurn[0] && this.y === positionAtStartOfTurn[1]) {
			this.rotationState = RotationState.Stationary1;
			this.logEvent({
				type: 'animation',
				fighter: this.index!,
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
				if (ret.every((x) => x === 0)) {
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
		return this.fight!.fighters.filter((f) => f.team === this.team && f.hp > 0);
	}

	enemies(): FighterInBattle[] {
		return this.fight!.fighters.filter((f) => f.team !== this.team && f.hp > 0);
	}

	meleeDamageMultiplier(): number {
		// cannot have less than 25% multiplier
		return Math.max(0.5 + 0.1 * this.stats.strength, 0.25);
	}

	rangedHitChance(): number {
		// hit chance must be between 0% and 100%
		return Math.max(0, Math.min(0.25 + 0.05 * this.stats.accuracy, 1));
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

	timeToAttack(target: FighterInBattle, chargeNeeded: number): number {
		return Math.max(
			this.cooldown + this.timeToCharge() * Math.max(chargeNeeded - this.charges, 0),
			this.timeToReach(target)
		);
	}

	valueOfAttack(target: FighterInBattle, dps: number, timeUntilFirst: number): number {
		return target.fighterDanger() / (timeUntilFirst + target.effectiveHp() / dps);
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
		this.fight!.uncrowd(this);

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
			type: 'animation',
			fighter: this.index!,
			updates: {
				x: Number(this.x.toFixed(2)),
				y: Number(this.y.toFixed(2)),
				rotation: this.rotationState
			}
		});
		if (causeFlip) {
			this.logEvent({
				type: 'animation',
				fighter: this.index!,
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
		let [deltaX, deltaY] = scaleVectorToMagnitude(
			target.x - this.x,
			target.y - this.y,
			distanceToMove
		);
		this.moveByVector(deltaX, deltaY);
	}

	moveAwayFrom(target: FighterInBattle): void {
		const distanceToMove = this.speedInMetersPerSecond() * TICK_LENGTH;
		let [deltaX, deltaY] = scaleVectorToMagnitude(
			this.x - target.x,
			this.y - target.y,
			distanceToMove
		);
		this.moveByVector(deltaX, deltaY, false);
	}

	charge(): void {
		this.charges += 1;
		this.cooldown = this.timeToCharge();
		this.logEvent({
			type: 'particle',
			fighter: this.index!,
			particleImg: '/static/charge.png'
		});
	}

	attemptMeleeAttack(
		target: FighterInBattle,
		equipmentUsed: EquipmentInBattle,
		damage: number,
		cooldown: number,
		knockback: number,
		chargeNeeded: number
	): void {
		const cooldownReachDifferential =
			this.timeToAttack(target, chargeNeeded) - this.timeToReach(target);
		if (this.distanceTo(target) > MELEE_RANGE && cooldownReachDifferential < 0.7) {
			this.moveTowards(target);
		} else if (cooldownReachDifferential > 0.7) {
			this.moveAwayFrom(target);
		}
		if (
			this.distanceTo(target) < MELEE_RANGE &&
			this.cooldown === 0 &&
			this.charges >= chargeNeeded
		) {
			damage *= target.damageTakenMultiplier();
			damage = Math.ceil(damage);
			target.hp -= damage;
			this.cooldown = cooldown;
			this.charges -= chargeNeeded;
			target.flash = 1;

			// do knockback
			let [deltaX, deltaY] = scaleVectorToMagnitude(
				target.x - this.x,
				target.y - this.y,
				knockback
			);
			const rotatedX = Math.cos(KNOCKBACK_ROTATION * deltaX) - Math.sin(KNOCKBACK_ROTATION * deltaY);
			const rotatedY = Math.sin(KNOCKBACK_ROTATION * deltaX) + Math.cos(KNOCKBACK_ROTATION * deltaY);
			target.moveByVector(rotatedX, rotatedY, false);

			// log the hit with animation info
			this.logEvent({
				type: 'animation',
				fighter: target.index!,
				updates: {
					hp: target.hp,
					flash: target.flash
				}
			});
			this.logEvent({
				type: 'text',
				fighter: target.index!,
				text: damage.toString()
			});
			this.logEvent({
				type: 'particle',
				fighter: target.index!,
				particleImg: '/static/damage.png'
			});
			this.logEvent(
				{
					type: 'animation',
					fighter: this.index!,
					updates: {
						rotation: RotationState.BackswingStart
					}
				},
				2
			);
			this.logEvent(
				{
					type: 'animation',
					fighter: this.index!,
					updates: {
						rotation: RotationState.Backswing
					}
				},
				1
			);
			this.logEvent({
				type: 'animation',
				fighter: this.index!,
				updates: {
					rotation: RotationState.ForwardSwing
				}
			});
			this.rotationState = RotationState.ForwardSwing;

			this.equipment.forEach((e) => {
				e.onHitDealt?.(e, target, damage, equipmentUsed);
			});
			target.equipment.forEach((e) => {
				e.onHitTaken?.(e, this, damage, equipmentUsed);
			});
		} else if (chargeNeeded > this.charges) {
			this.charge();
		}
	}

	attemptRangedAttack(
		target: FighterInBattle,
		equipmentUsed: EquipmentInBattle,
		damage: number,
		cooldown: number,
		knockback: number,
		chargeNeeded: number,
		projectileImg: string
	): void {
		// run away if any enemy can reach this fighter before the cooldown ends
		const enemiesThatCanReachBeforeShot = this.enemies().filter(
			(f) => f.timeToAttack(this, chargeNeeded) < this.cooldown
		);
		if (enemiesThatCanReachBeforeShot.length > 0) {
			this.moveAwayFrom(enemiesThatCanReachBeforeShot[0]);
		}
		if (this.cooldown === 0 && this.charges >= chargeNeeded) {
			this.cooldown = cooldown;
			this.charges -= chargeNeeded;
			this.logEvent({
				type: 'projectile',
				fighter: this.index!,
				target: target.index!,
				projectileImg
			});
			this.logEvent(
				{
					type: 'animation',
					fighter: this.index!,
					updates: {
						rotation: RotationState.AimStart
					}
				},
				2
			);
			this.logEvent(
				{
					type: 'animation',
					fighter: this.index!,
					updates: {
						rotation: RotationState.Aim
					}
				},
				1
			);
			this.logEvent({
				type: 'animation',
				fighter: this.index!,
				updates: {
					rotation: RotationState.ForwardSwing
				}
			});

			// do damage + animations if the attack hits
			if (this.fight!.rng.randReal() < this.rangedHitChance()) {
				damage *= target.damageTakenMultiplier();
				damage = Math.ceil(damage);
				target.hp -= damage;
				target.flash = 1;

				// do knockback
				let [deltaX, deltaY] = scaleVectorToMagnitude(
					target.x - this.x,
					target.y - this.y,
					knockback
				);
				const rotatedX =
					Math.cos(KNOCKBACK_ROTATION * deltaX) - Math.sin(KNOCKBACK_ROTATION * deltaY);
				const rotatedY =
					Math.sin(KNOCKBACK_ROTATION * deltaX) + Math.cos(KNOCKBACK_ROTATION * deltaY);
				target.moveByVector(rotatedX, rotatedY, false);

				// log the hit with animation info
				this.logEvent({
					type: 'animation',
					fighter: target.index!,
					updates: {
						hp: target.hp,
						flash: target.flash
					}
				});
				this.logEvent({
					type: 'text',
					fighter: target.index!,
					text: damage.toString()
				});
				this.logEvent({
					type: 'particle',
					fighter: target.index!,
					particleImg: '/static/damage.png'
				});

				this.equipment.forEach((e) => {
					e.onHitDealt?.(e, target, damage, equipmentUsed);
				});
				target.equipment.forEach((e) => {
					e.onHitTaken?.(e, this, damage, equipmentUsed);
				});
			} else {
				this.logEvent({
					type: 'text',
					fighter: target.index!,
					text: 'Missed'
				});
			}
		} else if (chargeNeeded > this.charges) {
			this.charge();
		}
	}

	attemptAoeAttack(
		targets: FighterInBattle[],
		equipmentUsed: EquipmentInBattle,
		damage: number,
		cooldown: number,
		knockback: number,
		chargeNeeded: number,
		projectileImg: string
	): void {
		// run away if any enemy can reach this fighter before the cooldown ends
		const enemiesThatCanReachBeforeShot = this.enemies().filter(
			(f) => f.timeToAttack(this, chargeNeeded) < this.cooldown
		);
		if (enemiesThatCanReachBeforeShot.length > 0) {
			this.moveAwayFrom(enemiesThatCanReachBeforeShot[0]);
		}
		if (this.cooldown === 0 && this.charges >= chargeNeeded) {
			this.cooldown = cooldown;
			this.charges -= chargeNeeded;
			for (let target of targets) {
				this.logEvent({
					type: 'projectile',
					fighter: this.index!,
					target: target.index!,
					projectileImg
				});
				this.logEvent(
					{
						type: 'animation',
						fighter: this.index!,
						updates: {
							rotation: RotationState.AimStart
						}
					},
					2
				);
				this.logEvent(
					{
						type: 'animation',
						fighter: this.index!,
						updates: {
							rotation: RotationState.Aim
						}
					},
					1
				);
				this.logEvent({
					type: 'animation',
					fighter: this.index!,
					updates: {
						rotation: RotationState.ForwardSwing
					}
				});

				// do damage + animations if the attack hits
				damage *= target.damageTakenMultiplier();
				damage = Math.ceil(damage);
				target.hp -= damage;
				target.flash = 1;

				// do knockback
				let [deltaX, deltaY] = scaleVectorToMagnitude(
					target.x - this.x,
					target.y - this.y,
					knockback
				);
				const rotatedX =
					Math.cos(KNOCKBACK_ROTATION * deltaX) - Math.sin(KNOCKBACK_ROTATION * deltaY);
				const rotatedY =
					Math.sin(KNOCKBACK_ROTATION * deltaX) + Math.cos(KNOCKBACK_ROTATION * deltaY);
				target.moveByVector(rotatedX, rotatedY, false);

				// log the hit with animation info
				this.logEvent({
					type: 'animation',
					fighter: target.index!,
					updates: {
						hp: target.hp,
						flash: target.flash
					}
				});
				this.logEvent({
					type: 'text',
					fighter: target.index!,
					text: damage.toString()
				});
				this.logEvent({
					type: 'particle',
					fighter: target.index!,
					particleImg: '/static/damage.png'
				});

				this.equipment.forEach((e) => {
					e.onHitDealt?.(e, target, damage, equipmentUsed);
				});
				target.equipment.forEach((e) => {
					e.onHitTaken?.(e, this, damage, equipmentUsed);
				});
			}
		} else if (chargeNeeded > this.charges) {
			this.charge();
		}
	}

	logEvent(event: MidFightEvent, ticksAgo: number = 0): void {
		const tick = this.fight!.eventLog[this.fight!.eventLog.length - 1 - ticksAgo];
		// if this is not an animation tick or this fighter doesn't have a previous animation tick,
		// just push to the tick like normal
		// otherwise, merge with the last animation tick (overwriting where conflicts exist)
		const animationEventForFighter = tick.filter(
			(e) => e.type === 'animation' && event.type === 'animation' && e.fighter === event.fighter
		);
		if (event.type === 'animation' && animationEventForFighter.length > 0) {
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

function fists(): EquipmentInBattle {
	return {
		name: 'Fists',
		slots: [],
		imgUrl: '',
		isFighterAbility: true,
		actionDanger: (self: EquipmentInBattle) => {
			return 5 * self.fighter!.meleeDamageMultiplier();
		},
		getActionPriority: (self: EquipmentInBattle) => {
			const dps = 5 * self.fighter!.meleeDamageMultiplier();
			let maxValue = 0;
			for (let target of self.fighter!.enemies()) {
				maxValue = Math.max(
					self.fighter!.valueOfAttack(target, dps, self.fighter!.timeToAttack(target, 0))
				);
			}
			return maxValue;
		},
		whenPrioritized: (self: EquipmentInBattle) => {
			const dps = 5 * self.fighter!.meleeDamageMultiplier();
			let bestTarget: FighterInBattle;
			let maxValue = 0;
			for (let target of self.fighter!.enemies()) {
				const value = self.fighter!.valueOfAttack(
					target,
					dps,
					self.fighter!.timeToAttack(target, 0)
				);
				if (bestTarget === undefined || value > maxValue) {
					bestTarget = target;
					maxValue = value;
				}
			}
			self.fighter!.attemptMeleeAttack(
				bestTarget!,
				self,
				12 * self.fighter!.meleeDamageMultiplier(),
				2.4,
				0.2,
				0
			);
		}
	};
}
