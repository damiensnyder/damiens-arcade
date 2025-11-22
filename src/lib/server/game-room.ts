import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Viewer, ClientMessage, ServerMessage, ActionResult } from '../shared/common/types';
import type { GameLogicBase } from './game-logic/base';
import { jwtVerify } from 'jose';
import cookie from 'cookie';
import { readFileSync, existsSync } from 'fs';

const TEARDOWN_TIME = 60 * 60 * 1000; // one hour
let JWT_SECRET: Buffer | null = null;

// Try to load JWT secret if it exists
try {
	if (existsSync('secrets/secrets.json')) {
		JWT_SECRET = Buffer.from(
			JSON.parse(readFileSync('secrets/secrets.json').toString())['SIGNING_KEY']
		);
	}
} catch (err) {
	console.warn('No JWT secret found, authentication disabled');
}

export class GameRoom {
	private connections = new Map<WebSocket, Viewer>();
	private viewers: Viewer[] = [];
	private gameLogic: GameLogicBase<any, any, any, any>;
	private emptyCallback?: () => void;
	private teardownTimer: NodeJS.Timeout;
	private host?: number;
	private nextViewerIndex = 0;
	private isHotSeat = false;

	constructor(
		private gameType: string,
		private roomCode: string,
		gameLogic: GameLogicBase<any, any, any, any>
	) {
		this.gameLogic = gameLogic;
		this.teardownTimer = setTimeout(() => this.emptyCallback?.(), TEARDOWN_TIME);
	}

	applyInitialSettings(settings: any) {
		this.gameLogic.applyInitialSettings(settings);
	}

	setHotSeat(value: boolean) {
		this.isHotSeat = value;
	}

	async handleConnection(ws: WebSocket, request: IncomingMessage) {
		const siteUsername = await this.getUsernameFromRequest(request);

		const viewer: Viewer = {
			id: `${this.roomCode}-${this.nextViewerIndex}`,
			index: this.nextViewerIndex++,
			siteUsername,
			isHost: this.host === undefined
		};

		if (this.host === undefined) {
			this.host = viewer.index;
		}

		this.connections.set(ws, viewer);
		this.viewers.push(viewer);

		// Send initial gamestate
		const gamestate = this.gameLogic.viewpointOf(viewer);
		this.send(ws, { type: 'gamestate', data: gamestate });

		// Notify game logic of connection
		this.gameLogic.handleConnect(viewer);

		// Broadcast join event to others
		this.broadcast({ type: 'event', event: { type: 'join', viewer: viewer.index } }, ws);

		// Auto-join both sides in hot seat mode (for first connection only)
		if (this.isHotSeat && this.viewers.length === 1) {
			this.gameLogic.autoJoinHotSeat(viewer);
		}

		// Reset teardown timer
		this.resetTeardownTimer();

		// Handle messages
		ws.on('message', (data) => {
			try {
				const message: ClientMessage = JSON.parse(data.toString());
				this.handleMessage(ws, message);
			} catch (err) {
				this.send(ws, { type: 'error', message: 'Invalid message format' });
			}
		});

		// Handle disconnect
		ws.on('close', () => {
			const viewer = this.connections.get(ws);
			if (viewer) {
				this.connections.delete(ws);
				this.viewers = this.viewers.filter((v) => v.id !== viewer.id);

				this.gameLogic.handleDisconnect(viewer);

				// Reassign host if needed
				if (viewer.isHost && this.viewers.length > 0) {
					const newHost = this.viewers[0];
					newHost.isHost = true;
					this.host = newHost.index;
					this.broadcast({ type: 'event', event: { type: 'changeHost', host: this.host } });
				} else if (this.viewers.length === 0) {
					this.host = undefined;
				}

				this.broadcast({ type: 'event', event: { type: 'leave', viewerIndex: viewer.index } });

				if (this.isEmpty()) {
					this.resetTeardownTimer();
				}
			}
		});

		ws.on('error', (err) => {
			console.error('WebSocket error:', err);
		});
	}

	private handleMessage(ws: WebSocket, message: ClientMessage) {
		const viewer = this.connections.get(ws);
		if (!viewer) return;

		if (message.type === 'action') {
			// Check if this is a room settings change (host-only)
			if (
				message.action?.type === 'changeRoomSettings' &&
				viewer.index === this.host &&
				typeof message.action.roomName === 'string' &&
				typeof message.action.isPublic === 'boolean'
			) {
				this.gameLogic.changeRoomSettings(message.action.roomName, message.action.isPublic);
				this.broadcast({
					type: 'event',
					event: {
						type: 'changeRoomSettings',
						roomName: this.gameLogic.getRoomInfo().roomName,
						isPublic: this.gameLogic.getRoomInfo().isPublic
					}
				});
			} else {
				// Handle game-specific action
				const result = this.gameLogic.handleAction(viewer, message.action);

				if (result.success) {
					for (const event of result.events) {
						this.broadcast({ type: 'event', event });
					}
				} else {
					this.send(ws, { type: 'error', message: result.error });
				}
			}

			this.resetTeardownTimer();
		}
	}

	private send(ws: WebSocket, message: ServerMessage) {
		if (ws.readyState === ws.OPEN) {
			ws.send(JSON.stringify(message));
		}
	}

	private broadcast(message: ServerMessage, except?: WebSocket) {
		for (const [ws, viewer] of this.connections) {
			if (ws !== except) {
				this.send(ws, message);
			}
		}
	}

	private resetTeardownTimer() {
		clearTimeout(this.teardownTimer);
		if (this.isEmpty()) {
			this.teardownTimer = setTimeout(() => this.emptyCallback?.(), TEARDOWN_TIME);
		}
	}

	private async getUsernameFromRequest(request: IncomingMessage): Promise<string | null> {
		if (!JWT_SECRET) return null;

		try {
			const cookies = cookie.parse(request.headers['cookie'] || '');
			const authToken = cookies.auth_token;
			if (authToken) {
				const { payload } = await jwtVerify(authToken, JWT_SECRET, { algorithms: ['HS256'] });
				return (payload.username as string) || null;
			}
		} catch (err) {
			// Invalid token, ignore
		}
		return null;
	}

	isEmpty(): boolean {
		return this.connections.size === 0;
	}

	onEmpty(callback: () => void) {
		this.emptyCallback = callback;
	}

	getPublicInfo() {
		const roomInfo = this.gameLogic.getRoomInfo();
		return {
			gameType: this.gameType,
			roomCode: this.roomCode,
			roomName: roomInfo.roomName,
			isPublic: roomInfo.isPublic,
			gameStage: roomInfo.gameStage,
			playerCount: this.viewers.length,
			maxPlayers: 8 // TODO: make this game-specific
		};
	}
}
