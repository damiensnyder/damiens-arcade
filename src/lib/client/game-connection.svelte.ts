import type { ServerMessage } from '$lib/shared/common/types';

export class GameConnection<TGameState = any, TEvent = any, TAction = any> {
	private socket: WebSocket | null = null;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 10;

	connected = $state(false);
	error = $state<string | null>(null);
	gameState = $state<TGameState | null>(null);
	eventLog = $state<string[]>([]);

	constructor(
		private gameType: string,
		private roomCode: string,
		private onEvent: (event: TEvent) => void
	) {}

	connect() {
		const wsUrl = import.meta.env.DEV
			? `ws://localhost:3000/ws/${this.gameType}/${this.roomCode}`
			: `wss://${window.location.host}/ws/${this.gameType}/${this.roomCode}`;

		this.socket = new WebSocket(wsUrl);

		this.socket.addEventListener('open', () => {
			this.connected = true;
			this.error = null;
			this.reconnectAttempts = 0;
			this.addToLog('Connected to game');
		});

		this.socket.addEventListener('message', (event) => {
			const message: ServerMessage<TGameState, TEvent> = JSON.parse(event.data);

			switch (message.type) {
				case 'gamestate':
					this.gameState = message.data;
					break;

				case 'event':
					this.onEvent(message.event);
					break;

				case 'error':
					this.error = message.message;
					this.addToLog(`Error: ${message.message}`);
					break;
			}
		});

		this.socket.addEventListener('close', () => {
			this.connected = false;
			this.addToLog('Disconnected from game');

			// Auto-reconnect
			if (this.reconnectAttempts < this.maxReconnectAttempts) {
				this.reconnectAttempts++;
				const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
				setTimeout(() => this.connect(), delay);
			}
		});

		this.socket.addEventListener('error', (err) => {
			console.error('WebSocket error:', err);
			this.error = 'Connection error';
		});
	}

	sendAction(action: TAction) {
		if (!this.socket || !this.connected) {
			console.warn('Cannot send action: not connected');
			return;
		}

		this.socket.send(JSON.stringify({ type: 'action', action }));
	}

	disconnect() {
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}

	addToLog(message: string) {
		this.eventLog = [...this.eventLog, message];
	}
}
