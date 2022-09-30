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
		res.statusCode = 200;
		res.end(JSON.stringify(this.roomManager.createRoom(req.params.gameType)));
	}

	listActiveRooms(_req, res, _next) {
		if (!this.roomManager) return;
    res.statusCode = 200;
    res.end(JSON.stringify(this.roomManager.listActiveRooms()));
	}

	redirectToCorrectGameType(req, res, _next) {
		const gameType = this.roomManager.getGameTypeOfRoom(req.params.roomCode);
		if (gameType === null) {
			res.statusCode = 302;
			res.redirect("/");
		} else {
			res.statusCode = 302;
			res.redirect(gameType.replaceAll(" ", "-").toLowerCase());
		}
	}
}

const roomManagerMiddleware = {
	name: "room-manager",
	configureServer(server) {
		const wrapper = new RoomManagerWrapper(server);

		// Create a game room
		server.middlewares.use("/create-room/:gameType", wrapper.createRoom.bind(wrapper));
		
		// List active game rooms
		server.middlewares.use("/active-rooms", wrapper.listActiveRooms.bind(wrapper));

		// Redirect joiner to appropriate type of game
		server.middlewares.use("/game/:roomCode", wrapper.redirectToCorrectGameType.bind(wrapper));
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