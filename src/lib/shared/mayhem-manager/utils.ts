import {
	EquipmentSlot,
	type Bracket,
	type Equipment,
	type Fighter,
	type PreseasonTeam,
	type Team
} from './types';

export function getIndexByController(teams: Team[], controller: number): number | null {
	if (teams === undefined) return null;
	for (let i = 0; i < teams.length; i++) {
		if (teams[i].controller === controller) {
			return i;
		}
	}
	return null;
}

export function getTeamByController(
	teams: Team[] | PreseasonTeam[],
	controller: number
): Team | PreseasonTeam | null {
	if (teams === undefined) return null;
	for (const team of teams) {
		if (team.controller === controller) {
			return team;
		}
	}
	return null;
}

export function slotsToString(slots: EquipmentSlot[]): string {
	let joined = slots.join(', ');
	if (joined === '') return 'none';
	if (joined === 'hand, hand') return 'two-handed';
	return joined;
}

export function nextMatch(
	bracket: Bracket
): Bracket & {
	left: Bracket;
	right: Bracket;
} {
	// @ts-ignore
	if (bracket.left === undefined) {
		return {
			left: { winner: -1 },
			right: { winner: -1 },
			winner: null
		};
	}
	let nextMatch: Bracket & {
		left: Bracket;
		right: Bracket;
	};
	const matchesToCheck: Bracket[] = [bracket];
	while (matchesToCheck.length > 0) {
		const match = matchesToCheck.shift()!;
		if (match.winner === null) {
			// @ts-ignore
			nextMatch = match;
			nextMatch = match as any;
			matchesToCheck.push(nextMatch.right);
			matchesToCheck.push(nextMatch.left);
		}
	}
	return nextMatch!;
}

export function isValidEquipment(equipment: Equipment[]) {
	let usedSlots: EquipmentSlot[] = [];
	for (const e of equipment) {
		usedSlots = usedSlots.concat(e.slots);
		if (
			usedSlots.filter((s) => s === EquipmentSlot.Head).length > 1 ||
			usedSlots.filter((s) => s === EquipmentSlot.Torso).length > 1 ||
			usedSlots.filter((s) => s === EquipmentSlot.Hand).length > 2 ||
			usedSlots.filter((s) => s === EquipmentSlot.Legs).length > 1 ||
			usedSlots.filter((s) => s === EquipmentSlot.Feet).length > 1
		) {
			return false;
		}
	}
	return true;
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
	return (
		usedSlots.filter((s) => s === EquipmentSlot.Head).length <= 1 &&
		usedSlots.filter((s) => s === EquipmentSlot.Torso).length <= 1 &&
		usedSlots.filter((s) => s === EquipmentSlot.Hand).length <= 2 &&
		usedSlots.filter((s) => s === EquipmentSlot.Legs).length <= 1 &&
		usedSlots.filter((s) => s === EquipmentSlot.Feet).length <= 1
	);
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
		if (
			usedSlots.filter((s) => s === EquipmentSlot.Head).length > 1 ||
			usedSlots.filter((s) => s === EquipmentSlot.Torso).length > 1 ||
			usedSlots.filter((s) => s === EquipmentSlot.Hand).length > 2 ||
			usedSlots.filter((s) => s === EquipmentSlot.Legs).length > 1 ||
			usedSlots.filter((s) => s === EquipmentSlot.Feet).length > 1
		) {
			return false;
		}
	}
	return true;
}
