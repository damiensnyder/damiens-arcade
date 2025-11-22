import type { WordInGrid, Coordinate, Badge } from './types';

// gets all words (not necessarily valid) in your grid
export function getAllWords(grid: string[][]): WordInGrid[] {
	const newWords: WordInGrid[] = [];
	for (let x = 0; x < 11; x++) {
		let currentWord = '';
		for (let y = 0; y < 12; y++) {
			if (grid[x][y] !== '') {
				currentWord += grid[x][y];
			} else {
				if (currentWord.length > 1) {
					newWords.push({
						word: currentWord,
						starts: [x, y - currentWord.length],
						down: false
					});
				}
				currentWord = '';
			}
		}
		if (currentWord.length > 1) {
			newWords.push({
				word: currentWord,
				starts: [x, 12 - currentWord.length],
				down: false
			});
		}
	}
	for (let y = 0; y < 12; y++) {
		let currentWord = '';
		for (let x = 0; x < 11; x++) {
			if (grid[x][y] !== '') {
				currentWord += grid[x][y];
			} else {
				if (currentWord.length > 1) {
					newWords.push({
						word: currentWord,
						starts: [x - currentWord.length, y],
						down: true
					});
				}
				currentWord = '';
			}
		}
		if (currentWord.length > 1) {
			newWords.push({
				word: currentWord,
				starts: [11 - currentWord.length, y],
				down: true
			});
		}
	}
	return newWords;
}

export function gridIsLegal(
	legalWords: string[],
	words: WordInGrid[]
): {
	gridLegality: boolean[][];
	illegalWordFound: boolean;
} {
	let illegalWordFound = false;
	const isLegal = [...Array(11)].map((_) => Array(12).fill(false));
	for (const word of words) {
		if (legalWords.includes(word.word)) {
			if (word.down) {
				for (let x = 0; x < word.word.length; x++) {
					isLegal[x + word.starts[0]][word.starts[1]] = true;
				}
			} else {
				for (let y = 0; y < word.word.length; y++) {
					isLegal[word.starts[0]][y + word.starts[1]] = true;
				}
			}
		} else {
			illegalWordFound = true;
		}
	}
	return {
		gridLegality: isLegal,
		illegalWordFound
	};
}

// checks if you won, also if your letters are in legal positions
export function gameIsWon(grid: string[][]): boolean {
	let firstX = 0;
	let firstY = 0;
	while (grid[firstX][firstY] === '') {
		firstY++;
		if (firstY == 12) {
			firstY = 0;
			firstX++;
		}
	}

	let explored: Coordinate[] = [];
	let frontier: Coordinate[] = [
		{
			x: firstX,
			y: firstY
		}
	];
	while (frontier.length > 0) {
		const newFrontier = [];
		for (let coord of frontier) {
			for (let newCoord of [
				{ x: coord.x + 1, y: coord.y },
				{ x: coord.x - 1, y: coord.y },
				{ x: coord.x, y: coord.y + 1 },
				{ x: coord.x, y: coord.y - 1 }
			]) {
				if (
					newCoord.x >= 0 &&
					newCoord.x < 11 &&
					newCoord.y >= 0 &&
					newCoord.y <= 12 &&
					grid[newCoord.x][newCoord.y] !== '' &&
					explored
						.concat(frontier)
						.concat(newFrontier)
						.every((coord2) => newCoord.x !== coord2.x || newCoord.y != coord2.y)
				) {
					newFrontier.push(newCoord);
				}
			}
		}
		explored = explored.concat(frontier);
		frontier = newFrontier;
	}

	return explored.length === 12;
}

export function getBadges(grid: string[][], words: WordInGrid[], solveTime: number): Badge[] {
	const badges: Badge[] = [];
	if (solveTime <= 30) {
		badges.push({
			name: 'Ludicrous Speed',
			icon: '🤯',
			description: 'Won in under 30 seconds.'
		});
	} else if (solveTime <= 60) {
		badges.push({
			name: 'Supersonic',
			icon: '✈️',
			description: 'Won in under 1 minute.'
		});
	} else if (solveTime <= 120) {
		badges.push({
			name: 'Blazing Fast',
			icon: '🔥',
			description: 'Won in under 2 minutes.'
		});
	} else if (solveTime <= 180) {
		badges.push({
			name: 'Fast',
			icon: '🏃',
			description: 'Won in under 3 minutes.'
		});
	}
	for (let x = 0; x < 10; x++) {
		for (let y = 0; y < 11; y++) {
			if (
				grid[x][y] !== '' &&
				grid[x + 1][y] !== '' &&
				grid[x][y + 1] !== '' &&
				grid[x + 1][y + 1] !== ''
			) {
				badges.push({
					name: 'Nuclear Family',
					icon: '👨‍👩‍👧‍👦',
					description: 'Grid contains a 2x2 square of letters.'
				});
				break;
			}
		}
	}
	if (words.length === 2) {
		badges.push({
			name: 'Perfect Pair',
			icon: '☯️',
			description: 'Grid contains only 2 words.'
		});
	}
	if (words.length >= 6) {
		badges.push({
			name: 'Like Sardines',
			icon: '🐟',
			description: 'Grid has 6 or more words.'
		});
	}
	for (const word of words) {
		if (word.word.length >= 8) {
			badges.push({
				name: 'Sesquipedalian',
				icon: '🧠',
				description: 'Grid contains a word with 8 or more letters.'
			});
		}
	}
	// flood fill from (0, 0), stopping at any letters, and checking if there are less than 120 empty squares reachable
	let explored: Coordinate[] = [];
	let frontier: Coordinate[] = [
		{
			x: 0,
			y: 0
		}
	];
	while (frontier.length > 0) {
		const newFrontier = [];
		for (let coord of frontier) {
			for (let newCoord of [
				{ x: coord.x + 1, y: coord.y },
				{ x: coord.x - 1, y: coord.y },
				{ x: coord.x, y: coord.y + 1 },
				{ x: coord.x, y: coord.y - 1 },
				{ x: coord.x + 1, y: coord.y + 1 },
				{ x: coord.x - 1, y: coord.y + 1 },
				{ x: coord.x + 1, y: coord.y - 1 },
				{ x: coord.x - 1, y: coord.y - 1 }
			]) {
				if (
					newCoord.x >= 0 &&
					newCoord.x < 11 &&
					newCoord.y >= 0 &&
					newCoord.y <= 12 &&
					grid[newCoord.x][newCoord.y] === '' &&
					explored
						.concat(frontier)
						.concat(newFrontier)
						.every((coord2) => newCoord.x !== coord2.x || newCoord.y != coord2.y)
				) {
					newFrontier.push(newCoord);
				}
			}
		}
		explored = explored.concat(frontier);
		frontier = newFrontier;
	}
	if (explored.length < 120) {
		badges.push({
			name: 'Donut',
			icon: '🍩',
			description: 'Grid contains a rectangle with a hole in the middle.'
		});
	}
	let top = 10;
	let bottom = 0;
	let left = 11;
	let right = 0;
	for (const word of words) {
		top = Math.min(top, word.starts[0]);
		left = Math.min(left, word.starts[1]);
		bottom = Math.max(bottom, word.starts[0] + word.word.length - 1);
		right = Math.min(right, word.starts[1] + word.word.length - 1);
	}
	const horizMidpoint = (left + right) / 2;
	const vertMidpoint = (top + bottom) / 2;
	const rotSym = words.every((word) => {
		const oppositeX = 2 * horizMidpoint - word.starts[0];
		const oppositeY = 2 * vertMidpoint - word.starts[1];
		!words.every((word2) => {
			return (
				word.down !== word2.down ||
				word2.starts[0] !== oppositeX ||
				word2.starts[1] !== oppositeY
			);
		});
	});
	const horizSym = words.every((word) => {
		const oppositeX = 2 * horizMidpoint - word.starts[0];
		!words.every((word2) => {
			return (
				word.down !== word2.down ||
				word2.starts[0] !== oppositeX ||
				word2.starts[1] !== word.starts[1]
			);
		});
	});
	const vertSym = words.every((word) => {
		const oppositeY = 2 * vertMidpoint - word.starts[1];
		!words.every((word2) => {
			return (
				word.down !== word2.down ||
				word2.starts[0] !== word.starts[1] ||
				word2.starts[1] !== oppositeY
			);
		});
	});
	if (rotSym || horizSym || vertSym) {
		badges.push({
			name: 'Perfect Balance',
			icon: '☯️',
			description: 'Grid is symmetrical.'
		});
	}
	return badges;
}
