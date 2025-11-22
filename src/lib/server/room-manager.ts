import { GameRoom } from './game-room';
import type { GameLogicBase } from './game-logic/base';
import { hashRoomCode } from './utils/prng';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

type GameFactory = (roomCode: string, seed: number) => GameLogicBase<any, any, any, any>;

export class RoomManager {
	private rooms = new Map<string, GameRoom>();
	private gameFactories = new Map<string, GameFactory>();

	registerGame(gameType: string, factory: GameFactory) {
		this.gameFactories.set(gameType, factory);
	}

	getOrCreateRoom(gameType: string, roomCode: string): GameRoom {
		const roomId = `${gameType}:${roomCode}`;

		let room = this.rooms.get(roomId);
		if (!room) {
			const factory = this.gameFactories.get(gameType);
			if (!factory) {
				throw new Error(`Unknown game type: ${gameType}`);
			}

			const seed = hashRoomCode(roomCode);
			const gameLogic = factory(roomCode, seed);

			room = new GameRoom(gameType, roomCode, gameLogic);
			this.rooms.set(roomId, room);

			// Clean up when room is empty for 1 hour
			room.onEmpty(() => {
				setTimeout(() => {
					if (room!.isEmpty()) {
						this.rooms.delete(roomId);
						console.log(`♻️  Room ${roomId} cleaned up`);
					}
				}, 60 * 60 * 1000);
			});

			console.log(`✨ Created room: ${roomId}`);
		}

		return room;
	}

	createRoom(gameType: string): { roomCode: string } {
		const roomCode = this.generateRoomCode();
		this.getOrCreateRoom(gameType, roomCode);
		return { roomCode };
	}

	generateRoomCode(): string {
		const roomCodeLength = 3 + Math.ceil(Math.log(this.rooms.size + 2) / Math.log(26));
		let roomCode = '';

		while (roomCode === '' || this.rooms.has(roomCode)) {
			roomCode = '';
			for (let i = 0; i < roomCodeLength; i++) {
				roomCode += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
			}
		}

		return roomCode;
	}

	listPublicRooms() {
		const publicRooms = [];

		for (const room of this.rooms.values()) {
			const info = room.getPublicInfo();
			if (info.isPublic) {
				publicRooms.push(info);
			}
		}

		return { rooms: publicRooms };
	}

	getGameType(roomCode: string): string | null {
		for (const [roomId, room] of this.rooms) {
			if (roomId.endsWith(`:${roomCode}`)) {
				return room.getPublicInfo().gameType;
			}
		}
		return null;
	}
}
