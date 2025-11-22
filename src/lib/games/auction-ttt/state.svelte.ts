// @ts-nocheck
import { GameConnection } from '$lib/client/game-connection.svelte';
import type { ClientGameState, GameEvent, Action } from '$lib/shared/auction-ttt/types';
import { Side, TurnPart } from '$lib/shared/auction-ttt/types';
import { oppositeSideOf } from '$lib/shared/auction-ttt/utils';

export class AuctionTTTState {
	connection: GameConnection<ClientGameState, GameEvent, Action>;

	// Local UI state
	currentBid = $state<number | null>(null);
	nominating = $state<[number, number] | null>(null);
	private timerInterval: ReturnType<typeof setInterval> | null = null;

	constructor(roomCode: string) {
		this.connection = new GameConnection('auction-ttt', roomCode, (event) =>
			this.applyEvent(event)
		);
	}

	// Computed properties
	get state() {
		return this.connection.gameState;
	}

	get connected() {
		return this.connection.connected;
	}

	get eventLog() {
		return this.connection.eventLog;
	}

	get myPlayer() {
		if (!this.state || this.state.gameStage === 'pregame') return null;

		const pov = this.state.pov;
		if (this.state.players.X.controller === pov) return this.state.players.X;
		if (this.state.players.O.controller === pov) return this.state.players.O;
		return null;
	}

	get mySide(): Side {
		if (!this.state) return Side.None;

		const pov = this.state.pov;
		if (this.state.players.X.controller === pov) return Side.X;
		if (this.state.players.O.controller === pov) return Side.O;
		return Side.None;
	}

	get isMyTurn(): boolean {
		if (!this.state || this.state.gameStage !== 'midgame') return false;

		const mySide = this.mySide;
		if (mySide === Side.None) return false;

		if (this.state.turnPart === TurnPart.Nominating) {
			return this.state.whoseTurnToNominate === mySide;
		} else if (this.state.turnPart === TurnPart.Bidding) {
			return this.state.whoseTurnToBid === mySide;
		}

		return false;
	}

	// Actions
	connect() {
		this.connection.connect();
	}

	disconnect() {
		this.connection.disconnect();
		this.stopTimer();
	}

	sendAction(action: Action) {
		this.connection.sendAction(action);
	}

	// Event handling
	private applyEvent(event: GameEvent) {
		const state = this.state;
		if (!state) return;

		switch (event.type) {
			case 'changeRoomSettings':
				state.roomName = event.roomName;
				state.isPublic = event.isPublic;
				break;

			case 'changeHost':
				state.host = event.host;
				if (event.host === state.pov) {
					this.connection.addToLog('You are now the host');
				}
				break;

			case 'changeGameSettings':
				if (state.gameStage === 'pregame') {
					state.settings = event.settings;
				}
				break;

			case 'join':
				(state.players[event.side] as any).controller = event.controller;
				this.connection.addToLog(`A player has joined as ${event.side}`);
				if (state.gameStage === 'midgame' && state.lastBid !== undefined) {
					this.currentBid = state.lastBid + 1;
				}
				break;

			case 'leave':
				delete (state.players[event.side] as any).controller;
				this.connection.addToLog(`The player playing ${event.side} has left`);
				break;

			case 'start':
				if (state.gameStage === 'pregame') {
					this.connection.addToLog('The game has started');
				} else {
					this.connection.addToLog('A new game has started');
				}
				// State will be updated by next gamestate message
				break;

			case 'timing':
				if (state.gameStage === 'midgame') {
					(state.players.X as any).timeUsed = event.X;
					(state.players.O as any).timeUsed = event.O;
					state.timeOfLastMove = event.timeOfLastMove;
				}
				break;

			case 'nominate':
				if (state.gameStage === 'midgame') {
					const nominator = state.whoseTurnToNominate;
					this.connection.addToLog(
						`${nominator} nominated a square with a starting bid of $${event.startingBid}`
					);
					this.nominating = null;
					this.currentBid = event.startingBid + 1;
				}
				break;

			case 'bid':
				if (state.gameStage === 'midgame' && state.whoseTurnToBid) {
					const bidder = oppositeSideOf(state.whoseTurnToBid);
					this.connection.addToLog(`${bidder} bid $${event.amount}`);
					this.currentBid = event.amount + 1;
				}
				break;

			case 'pass':
				if (state.gameStage === 'midgame' && state.whoseTurnToBid) {
					this.connection.addToLog(`${state.whoseTurnToBid} passed`);
				}
				break;

			case 'awardSquare':
				if (state.gameStage === 'midgame') {
					this.connection.addToLog(`The square has been awarded to ${event.side}`);
				}
				break;

			case 'gameOver':
				if (event.winningSide === Side.None) {
					this.connection.addToLog('The game is a tie!');
				} else {
					this.connection.addToLog(`${event.winningSide} has won the game!`);
				}
				this.stopTimer();
				break;

			case 'backToSettings':
				this.connection.addToLog('Returning to settings');
				break;
		}
	}

	// Timer management for tiebreaker
	private startTimer() {
		if (this.timerInterval) return;

		this.timerInterval = setInterval(() => {
			const state = this.state;
			if (!state || state.gameStage !== 'midgame' || !state.timeOfLastMove) return;

			const now = Date.now();
			const elapsed = now - state.timeOfLastMove;

			const whoseTurnItIs =
				state.turnPart === TurnPart.Bidding
					? state.whoseTurnToBid
					: state.whoseTurnToNominate;

			if (whoseTurnItIs && state.players[whoseTurnItIs].timeUsed !== undefined) {
				state.players[whoseTurnItIs].timeUsed! += elapsed;
				state.timeOfLastMove = now;
			}
		}, 1000);
	}

	private stopTimer() {
		if (this.timerInterval) {
			clearInterval(this.timerInterval);
			this.timerInterval = null;
		}
	}
}
