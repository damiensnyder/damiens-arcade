import { equipmentCatalog } from './equipment-catalog';
import { Fighter, Equipment, StatName } from './types';
import { readFileSync } from 'fs';

const coeffsRaw = readFileSync('src/lib/shared/mayhem-manager/data/ai-coeffs.csv').toString();
const lines = coeffsRaw.split('\n').filter((line) => line.includes('.'));
const pairs = lines.map((line) => {
	const [name, value] = line.split(',');
	return [name.replaceAll('"', '').replace('(Intercept)', 'baseline'), parseFloat(value)];
});
const COEFFICIENTS = Object.fromEntries(pairs);
const VALUE_TO_DOLLARS = 100;

function weightOfCoeff(name: string, fighter: Fighter, equipment?: Equipment[]): number {
	if (fighter.abilityName === name) {
		return 1;
	} else if (Object.values(StatName).includes(name as StatName)) {
		const ageAdjustment = equipment !== undefined ? 1 - 0.2 * fighter.experience : 0;
		return fighter.stats[name as StatName] + ageAdjustment;
	} else if (Object.keys(equipmentCatalog).includes(name)) {
		let amountEquipped = 0.05;
		if (equipment !== undefined) {
			amountEquipped = equipment.filter((e) => e.abilityName === name).length;
		}
		if (fighter.attunements.includes(name)) {
			amountEquipped *= 1.25;
		}
		return amountEquipped;
	}
	return 0;
}

export function fighterValue(fighter: Fighter): number {
	let value = COEFFICIENTS['baseline'];
	for (const c of Object.keys(COEFFICIENTS)) {
		if (c.includes(':')) {
			const [left, right] = c.split(':');
			value += COEFFICIENTS[c] * weightOfCoeff(left, fighter) * weightOfCoeff(right, fighter);
			if (Number.isNaN(value)) {
				console.log(c);
			}
		} else {
			value += COEFFICIENTS[c] * weightOfCoeff(c, fighter);
			if (Number.isNaN(value)) {
				console.log(c);
			}
		}
	}
	return value * VALUE_TO_DOLLARS;
}

// not taking experience into account
export function fighterValueInBattle(fighter: Fighter, equipment: Equipment[]): number {
	let value = COEFFICIENTS['baseline'];
	for (const c of Object.keys(COEFFICIENTS)) {
		if (c.includes(':')) {
			const [left, right] = c.split(':');
			value +=
				COEFFICIENTS[c] *
				weightOfCoeff(left, fighter, equipment) *
				weightOfCoeff(right, fighter, equipment);
		} else {
			value += COEFFICIENTS[c] * weightOfCoeff(c, fighter, equipment);
		}
	}
	return value * VALUE_TO_DOLLARS;
}
