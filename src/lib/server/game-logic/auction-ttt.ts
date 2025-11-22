// @ts-nocheck
import { GameLogicBase } from './base';
import type { Viewer, ActionResult } from '../../shared/common/types';
import {
	Side,
	TurnPart,
	type ServerGameState,
	type ClientGameState,
	type Action,
	type GameEvent,
	type Settings
} from '../../shared/auction-ttt/types';
import {
	ActionSchema,
	JoinSchema,
	LeaveSchema,
	ChangeGameSettingsSchema,
	StartGameSchema,
	NominateSchema,
	BidSchema,
	PassSchema,
	RematchSchema,
	BackToSettingsSchema
} from '../../shared/auction-ttt/schemas';
import {
	oppositeSideOf,
	winningSide,
	getSideByController,
	getPlayerByController
} from '../../shared/auction-ttt/utils';

export class AuctionTTTLogic extends GameLogicBase<
	ServerGameState,
	Action,
	GameEvent,
	ClientGameState
> {
	protected gameStage: 'pregame' | 'midgame' | 'postgame' = 'pregame';

	initialState(): ServerGameState {
		return {
			stage: 'pregame',
			players: {
				X: { money: 0 },
				O: { money: 0 }
			},
			squares: [
				[Side.None, Side.None, Side.None],
				[Side.None, Side.None, Side.None],
				[Side.None, Side.None, Side.None]
			],
			turnPart: TurnPart.None,
			settings: {
				startingMoney: 15,
				startingPlayer: Side.None,
				useTiebreaker: false
			}
		};
	}

	viewpointOf(viewer: Viewer): ClientGameState {
		const base = {
			roomCode: this.roomCode,
			roomName: this.roomName,
			isPublic: this.isPublic,
			host: viewer.isHost ? viewer.index : -1, // Will be overridden by actual host
			pov: viewer.index,
			connected: true
		};

		if (this.state.stage === 'pregame') {
			return {
				...base,
				gameStage: 'pregame',
				settings: this.state.settings,
				players: this.state.players
			};
		} else if (this.state.stage === 'midgame') {
			return {
				...base,
				gameStage: 'midgame',
				settings: this.state.settings,
				players: this.state.players,
				squares: this.state.squares,
				turnPart: this.state.turnPart,
				whoseTurnToNominate: this.state.whoseTurnToNominate!,
				whoseTurnToBid: this.state.whoseTurnToBid,
				lastBid: this.state.lastBid,
				currentlyNominatedSquare: this.state.currentlyNominatedSquare,
				timeOfLastMove: this.state.timeOfLastMove
			};
		} else {
			return {
				...base,
				gameStage: 'postgame',
				settings: this.state.settings,
				players: this.state.players,
				squares: this.state.squares,
				winner: this.state.winner!
			};
		}
	}

	handleAction(viewer: Viewer, rawAction: unknown): ActionResult<GameEvent> {
		// Validate action schema
		const parsed = ActionSchema.safeParse(rawAction);
		if (!parsed.success) {
			return { success: false, error: 'Invalid action format' };
		}

		const action = parsed.data;
		const playerControlledByViewer = getPlayerByController(this.state.players, viewer.index);
		const sideControlledByViewer = getSideByController(this.state.players, viewer.index);

		// Route to specific handlers
		switch (action.type) {
			case 'changeGameSettings':
				return this.handleChangeGameSettings(viewer, action.settings);

			case 'join':
				return this.handleJoin(viewer, action.side, sideControlledByViewer);

			case 'leave':
				return this.handleLeave(viewer, sideControlledByViewer);

			case 'start':
				return this.handleStart(viewer);

			case 'nominate':
				return this.handleNominate(viewer, action, sideControlledByViewer, playerControlledByViewer);

			case 'bid':
				return this.handleBid(viewer, action, sideControlledByViewer, playerControlledByViewer);

			case 'pass':
				return this.handlePass(viewer, sideControlledByViewer);

			case 'rematch':
				return this.handleRematch(viewer);

			case 'backToSettings':
				return this.handleBackToSettings(viewer);

			default:
				const _exhaustive: never = action;
				return { success: false, error: 'Unknown action type' };
		}
	}

	private handleChangeGameSettings(viewer: Viewer, settings: Settings): ActionResult<GameEvent> {
		if (!viewer.isHost) {
			return { success: false, error: 'Only host can change settings' };
		}

		this.state.settings = settings;
		return {
			success: true,
			events: [{ type: 'changeGameSettings', settings }]
		};
	}

	private handleJoin(viewer: Viewer, side: Side.X | Side.O, currentSide: Side): ActionResult<GameEvent> {
		// Allow joining multiple sides (hot seat), but not if someone else has already taken it
		if (
			this.state.players[side].controller !== undefined &&
			this.state.players[side].controller !== viewer.index
		) {
			return { success: false, error: 'Side already taken by another player' };
		}

		this.state.players[side].controller = viewer.index;
		return {
			success: true,
			events: [{ type: 'join', controller: viewer.index, side }]
		};
	}

	private handleLeave(viewer: Viewer, side: Side): ActionResult<GameEvent> {
		if (this.state.stage !== 'pregame') {
			return { success: false, error: 'Cannot leave after game started' };
		}

		if (side === Side.None) {
			return { success: false, error: 'Not in game' };
		}

		delete this.state.players[side].controller;
		return {
			success: true,
			events: [{ type: 'leave', side }]
		};
	}

	private handleStart(viewer: Viewer): ActionResult<GameEvent> {
		if (this.state.stage !== 'pregame') {
			return { success: false, error: 'Game already started' };
		}

		if (!viewer.isHost) {
			return { success: false, error: 'Only host can start game' };
		}

		if (
			this.state.players.X.controller === undefined ||
			this.state.players.O.controller === undefined
		) {
			return { success: false, error: 'Need both players' };
		}

		this.startGame();

		return {
			success: true,
			events: [{ type: 'start', startingPlayer: this.state.whoseTurnToNominate! }]
		};
	}

	private handleNominate(
		viewer: Viewer,
		action: Extract<Action, { type: 'nominate' }>,
		side: Side,
		player: any
	): ActionResult<GameEvent> {
		if (this.state.stage !== 'midgame') {
			return { success: false, error: 'Game not in progress' };
		}

		if (side === Side.None || side !== this.state.whoseTurnToNominate) {
			return { success: false, error: 'Not your turn' };
		}

		if (this.state.lastBid !== undefined) {
			return { success: false, error: 'Already nominating' };
		}

		const [row, col] = action.square;
		if (this.state.squares[row][col] !== Side.None) {
			return { success: false, error: 'Square already taken' };
		}

		if (action.startingBid > player.money || action.startingBid < 0) {
			return { success: false, error: 'Invalid bid amount' };
		}

		this.state.currentlyNominatedSquare = action.square;
		this.state.lastBid = action.startingBid;
		this.state.whoseTurnToBid = oppositeSideOf(side as Side.X | Side.O);
		this.updateTiming(side as Side.X | Side.O);

		const events: GameEvent[] = [
			{ type: 'nominate', square: action.square as [number, number], startingBid: action.startingBid }
		];

		// If opponent can't afford to outbid, award immediately
		const opponentSide = this.state.whoseTurnToBid as Side.X | Side.O;
		if (this.state.lastBid >= this.state.players[opponentSide].money) {
			events.push(...this.giveSquareToHighestBidder());
		} else {
			this.state.turnPart = TurnPart.Bidding;
		}

		return { success: true, events };
	}

	private handleBid(
		viewer: Viewer,
		action: Extract<Action, { type: 'bid' }>,
		side: Side,
		player: any
	): ActionResult<GameEvent> {
		if (this.state.stage !== 'midgame') {
			return { success: false, error: 'Game not in progress' };
		}

		if (side === Side.None || side !== this.state.whoseTurnToBid) {
			return { success: false, error: 'Not your turn' };
		}

		if (action.amount > player.money) {
			return { success: false, error: 'Insufficient funds' };
		}

		if (action.amount <= this.state.lastBid!) {
			return { success: false, error: 'Bid must be higher' };
		}

		this.state.lastBid = action.amount;
		this.state.whoseTurnToBid = oppositeSideOf(side as Side.X | Side.O);
		this.updateTiming(side as Side.X | Side.O);

		const events: GameEvent[] = [{ type: 'bid', amount: action.amount }];

		// If opponent can't afford to outbid, award immediately
		const opponentSide = this.state.whoseTurnToBid as Side.X | Side.O;
		if (this.state.lastBid >= this.state.players[opponentSide].money) {
			events.push(...this.giveSquareToHighestBidder());
		}

		return { success: true, events };
	}

	private handlePass(viewer: Viewer, side: Side): ActionResult<GameEvent> {
		if (this.state.stage !== 'midgame') {
			return { success: false, error: 'Game not in progress' };
		}

		if (side === Side.None || side !== this.state.whoseTurnToBid) {
			return { success: false, error: 'Not your turn' };
		}

		this.updateTiming(side as Side.X | Side.O);

		const events: GameEvent[] = [{ type: 'pass' }, ...this.giveSquareToHighestBidder()];

		return { success: true, events };
	}

	private handleRematch(viewer: Viewer): ActionResult<GameEvent> {
		if (this.state.stage !== 'postgame') {
			return { success: false, error: 'Game not finished' };
		}

		if (!viewer.isHost) {
			return { success: false, error: 'Only host can start rematch' };
		}

		if (
			this.state.players.X.controller === undefined ||
			this.state.players.O.controller === undefined
		) {
			return { success: false, error: 'Need both players' };
		}

		this.startGame();

		return {
			success: true,
			events: [{ type: 'start', startingPlayer: this.state.whoseTurnToNominate! }]
		};
	}

	private handleBackToSettings(viewer: Viewer): ActionResult<GameEvent> {
		if (this.state.stage !== 'postgame') {
			return { success: false, error: 'Game not finished' };
		}

		if (!viewer.isHost) {
			return { success: false, error: 'Only host can go back' };
		}

		this.state.stage = 'pregame';
		this.gameStage = 'pregame';
		delete this.state.winner;

		return { success: true, events: [{ type: 'backToSettings' }] };
	}

	private startGame(): void {
		this.state.stage = 'midgame';
		this.gameStage = 'midgame';
		this.state.turnPart = TurnPart.Nominating;
		this.state.players.X.money = this.state.settings.startingMoney;
		this.state.players.O.money = this.state.settings.startingMoney;

		this.state.whoseTurnToNominate =
			this.state.settings.startingPlayer === Side.None
				? this.randInt(0, 1) === 0
					? Side.X
					: Side.O
				: this.state.settings.startingPlayer;

		this.state.squares = [
			[Side.None, Side.None, Side.None],
			[Side.None, Side.None, Side.None],
			[Side.None, Side.None, Side.None]
		];

		if (this.state.settings.useTiebreaker) {
			this.state.players.X.timeUsed = 0;
			this.state.players.O.timeUsed = 0;
			this.state.timeOfLastMove = Date.now();
		}

		delete this.state.winner;
	}

	private giveSquareToHighestBidder(): GameEvent[] {
		const sideWhoLastBid = oppositeSideOf(this.state.whoseTurnToBid!) as Side.X | Side.O;
		const [row, col] = this.state.currentlyNominatedSquare!;

		this.state.squares[row][col] = sideWhoLastBid;
		this.state.players[sideWhoLastBid].money -= this.state.lastBid!;

		const events: GameEvent[] = [{ type: 'awardSquare', side: sideWhoLastBid }];

		delete this.state.lastBid;
		delete this.state.whoseTurnToBid;
		delete this.state.currentlyNominatedSquare;

		// Check for winner
		if (this.checkForWinner()) {
			events.push({ type: 'gameOver', ...this.state.winner! });
		} else {
			this.state.whoseTurnToNominate = oppositeSideOf(this.state.whoseTurnToNominate!);
			this.state.turnPart = TurnPart.Nominating;
		}

		return events;
	}

	private updateTiming(side: Side.X | Side.O): void {
		if (this.state.settings.useTiebreaker) {
			const now = Date.now();
			this.state.players[side].timeUsed! += now - this.state.timeOfLastMove!;
			this.state.timeOfLastMove = now;
		}
	}

	private checkForWinner(): boolean {
		this.state.winner = winningSide(this.state.squares);

		const boardFull = this.state.squares.every((row) => row.every((sq) => sq !== Side.None));

		if (this.state.winner.winningSide !== Side.None || boardFull) {
			// Tiebreaker
			if (this.state.settings.useTiebreaker && this.state.winner.winningSide === Side.None) {
				this.state.winner = {
					winningSide:
						this.state.players.X.timeUsed! < this.state.players.O.timeUsed! ? Side.X : Side.O,
					start: [-1, -1],
					end: [-1, -1]
				};
			}

			this.state.stage = 'postgame';
			this.gameStage = 'postgame';
			this.state.turnPart = TurnPart.None;
			delete this.state.whoseTurnToBid;
			delete this.state.whoseTurnToNominate;
			delete this.state.lastBid;
			delete this.state.currentlyNominatedSquare;
			delete this.state.timeOfLastMove;

			return true;
		}

		return false;
	}

	handleDisconnect(viewer: Viewer): void {
		const side = getSideByController(this.state.players, viewer.index);
		if (side !== Side.None) {
			delete this.state.players[side].controller;
		}
	}

	applyInitialSettings(settings: Settings): void {
		// Only apply settings in pregame
		if (this.state.stage === 'pregame') {
			this.state.settings = { ...this.state.settings, ...settings };
		}
	}

	autoJoinHotSeat(viewer: Viewer): void {
		// Auto-join both sides for hot seat mode
		if (this.state.stage === 'pregame') {
			this.state.players.X.controller = viewer.index;
			this.state.players.O.controller = viewer.index;
		}
	}
}
