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
		}).catch(() => console.error("Failed to import room manager."));
	}

	createRoom(req, res, _next) {
		if (!this.roomManager) return;
		let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        res.statusCode = 200;
        res.end(JSON.stringify(this.roomManager.createRoom(JSON.parse(body))));
      } catch (err) {
        console.log(err);
        res.statusCode = 400;
        res.end();
      }
    });
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
      plugins: [roomManagerMiddleware]
    }
	}
};

export default config;
