import { readFileSync } from 'fs';
import type { QlessProps } from '$lib/shared/daily-qless/types';

const ROLLS_PATH = 'src/lib/shared/daily-qless/rolls.json';

export function load(): QlessProps {
	// user can query for today or tomorrow, or if it's neither of those then give them yesterday
	const today = new Date();
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);

	try {
		const rolls = JSON.parse(readFileSync(ROLLS_PATH).toString());
		let roll1 = rolls[today.toISOString().substring(0, 10).replaceAll('-', '')];
		let roll2 = rolls[tomorrow.toISOString().substring(0, 10).replaceAll('-', '')];
		let roll3 = rolls[yesterday.toISOString().substring(0, 10).replaceAll('-', '')];
		return {
			date1: today.getUTCDate(),
			roll1: roll1.roll,
			legalWords1: roll1.legalWords,
			date2: tomorrow.getUTCDate(),
			roll2: roll2.roll, // Fixed: was roll1.roll in original
			legalWords2: roll2.legalWords,
			roll3: roll3.roll,
			legalWords3: roll3.legalWords
		};
	} catch (err) {
		return {
			date1: 0,
			roll1: '',
			legalWords1: [],
			date2: 0,
			roll2: '',
			legalWords2: [],
			roll3: 'rollnotfound',
			legalWords3: []
		};
	}
}
