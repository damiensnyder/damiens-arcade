import nodeAdapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';
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

	createRoom(_req, res, _next) {
		if (!this.roomManager) return;
		res.statusCode = 200;
		res.end(JSON.stringify(this.roomManager.createRoom()));
	}

	listActiveRooms(_req, res, _next) {
		if (!this.roomManager) return;
    res.statusCode = 200;
    res.end(JSON.stringify(this.roomManager.listActiveRooms()));
	}
}

const roomManagerMiddleware = {
	name: "room-manager",
	configureServer(server) {
		const wrapper = new RoomManagerWrapper(server);

		// Create a game room
		server.middlewares.use("/createRoom", wrapper.createRoom.bind(wrapper));
		
		// List active game rooms
		server.middlewares.use("/activeRooms", wrapper.listActiveRooms.bind(wrapper));
	}
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		adapter: nodeAdapter({
			out: "target"
		}),
		vite: {
      envPrefix: "BACKEND_",
      plugins: [roomManagerMiddleware],
			server: {
				fs: {
					allow: ["static"]
				}
			}
    }
	}
};

export default config;
