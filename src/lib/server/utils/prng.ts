// jsf32b PRNG implementation for deterministic randomness
export class PRNG {
	private state: [number, number, number, number];

	constructor(seed: number) {
		// Initialize state from seed
		this.state = [
			seed & 0xffffffff,
			(seed >>> 8) & 0xffffffff,
			(seed >>> 16) & 0xffffffff,
			(seed >>> 24) & 0xffffffff
		];
		// Warm up the PRNG
		for (let i = 0; i < 20; i++) {
			this.next();
		}
	}

	private next(): number {
		this.state[0] |= 0;
		this.state[1] |= 0;
		this.state[2] |= 0;
		this.state[3] |= 0;
		const t = (this.state[0] - ((this.state[1] << 23) | (this.state[1] >>> 9))) | 0;
		this.state[0] = this.state[1] ^ ((this.state[2] << 16) | (this.state[2] >>> 16)) | 0;
		this.state[1] = (this.state[2] + this.state[3]) | 0x0;
		this.state[2] = (this.state[3] + t) | 0x0;
		this.state[3] = (this.state[0] + t) | 0x0;
		return (this.state[3] >>> 0) / 4294967296;
	}

	randInt(min: number, max: number): number {
		return min + Math.floor((max + 1 - min) * this.next());
	}

	randReal(): number {
		return this.next();
	}

	randElement<T>(array: T[]): T {
		return array[this.randInt(0, array.length - 1)];
	}
}

export function hashRoomCode(roomCode: string): number {
	let hash = 0;
	for (let i = 0; i < roomCode.length; i++) {
		hash = (hash << 5) - hash + roomCode.charCodeAt(i);
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}
