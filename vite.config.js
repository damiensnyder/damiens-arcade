import { sveltekit } from '@sveltejs/kit/vite';
import { Server } from 'socket.io';

class RoomManagerWrapper {
	constructor(server) {
		this.importRoomManager(server);
	}

	async importRoomManager(server) {
		import("./dist/room-manager.js").then(({ default: RoomManager }) => {
			this.roomManager = new RoomManager(new Server(server.httpServer));
			import("./dist/set-up-test-rooms.js").then(({ default: setUpTestRooms }) => {
				setUpTestRooms(this.roomManager);
			}).catch((err) => console.error(`Failed to import test room creator: ${err}`));
		}).catch((err) => console.error(`Failed to import room manager: ${err}`));
	}

	createRoom(req, res, _next) {
		if (!this.roomManager) return;
		const gameType = req.url.substring(1);
		if (["auction-tic-tac-toe", "mayhem-manager"].includes(gameType)) {
			res.statusCode = 200;
			res.end(JSON.stringify(this.roomManager.createRoom(gameType)));
		} else {
			console.log(req.url);
			res.statusCode = 400;
			res.end();
		}
	}

	listActiveRooms(_req, res, _next) {
		if (!this.roomManager) return;
    res.statusCode = 200;
    res.end(JSON.stringify(this.roomManager.listActiveRooms()));
	}

	redirectToCorrectGameType(req, res, _next) {
		const gameType = this.roomManager.getGameTypeOfRoom(req.url.substring(1));
		if (gameType === null) {
			res.writeHead(302, {
				location: "/"
			});
			res.end();
		} else {
			res.writeHead(302, {
				location: `/${gameType.replaceAll(" ", "-").toLowerCase()}/${req.url.substring(1)}`
			});
			res.end();
		}
	}
}

const roomManagerMiddleware = {
	name: "room-manager",
	configureServer(server) {
		const wrapper = new RoomManagerWrapper(server);

		// Create a game room
		server.middlewares.use("/create-room", wrapper.createRoom.bind(wrapper));
		
		// List active game rooms
		server.middlewares.use("/active-rooms", wrapper.listActiveRooms.bind(wrapper));

		// Redirect joiner to appropriate type of game
		server.middlewares.use("/game", wrapper.redirectToCorrectGameType.bind(wrapper));
	}
};

/** @type {import('vite').UserConfig} */
const config = {
	envPrefix: "BACKEND_",
	plugins: [
		roomManagerMiddleware,
		sveltekit({ configFile: "svelte.config.js" }),
	],
	server: {
		fs: {
			allow: ["static"]
		},
		port: 3000
	}
};

export default config;