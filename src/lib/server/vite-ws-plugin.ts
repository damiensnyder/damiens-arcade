import type { Plugin, ViteDevServer } from 'vite';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { RoomManager } from './room-manager';

export function webSocketServer(): Plugin {
	let roomManager: RoomManager;

	return {
		name: 'websocket-server',

		async configureServer(server: ViteDevServer) {
			roomManager = new RoomManager();

			// Register games - lazy loaded when first needed
			const { AuctionTTTLogic } = await import('./game-logic/auction-ttt.js');
			roomManager.registerGame('auction-ttt', (roomCode, seed) => new AuctionTTTLogic(roomCode, seed));
			console.log('✅ Registered game: auction-ttt');

			// Create WebSocket server
			const wss = new WebSocketServer({ noServer: true });

			// Handle HTTP upgrade requests
			server.httpServer?.on('upgrade', (request, socket, head) => {
				const { pathname } = parse(request.url || '');

				// Match: /ws/auction-ttt/ABC123
				const match = pathname?.match(/^\/ws\/([^/]+)\/([^/]+)$/);
				if (!match) {
					socket.destroy();
					return;
				}

				const [, gameType, roomCode] = match;

				wss.handleUpgrade(request, socket, head, (ws) => {
					try {
						// Get or create room
						const room = roomManager.getOrCreateRoom(gameType, roomCode);

						// Handle connection
						room.handleConnection(ws, request);
					} catch (err) {
						console.error('Error handling WebSocket connection:', err);
						ws.close();
					}
				});
			});

			// API endpoints
			server.middlewares.use('/api/rooms/create', (req, res) => {
				if (req.method !== 'POST') {
					res.statusCode = 405;
					res.end();
					return;
				}

				let body = '';
				req.on('data', (chunk) => {
					body += chunk.toString();
				});

				req.on('end', () => {
					try {
						const { gameType } = JSON.parse(body);
						if (!gameType) {
							res.statusCode = 400;
							res.end(JSON.stringify({ error: 'Missing gameType' }));
							return;
						}

						const result = roomManager.createRoom(gameType);
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify(result));
					} catch (err) {
						res.statusCode = 400;
						res.end(JSON.stringify({ error: 'Invalid request' }));
					}
				});
			});

			server.middlewares.use('/api/rooms/list', (req, res) => {
				const result = roomManager.listPublicRooms();
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(result));
			});

			console.log('✅ WebSocket server ready on /ws/:gameType/:roomCode');
		}
	};
}
