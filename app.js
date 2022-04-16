import { createServer } from "http";
import Express from "express";
import { Server } from "socket.io";

import { handler } from "./target/handler.js";
import RoomManager from "./dist/room-manager.js";

const app = Express();
app.use(Express.json());

const httpServer = createServer(app);
const io = new Server(httpServer);
export const roomManager = new RoomManager(io);

// Create a game room
app.post("/createRoom", (_req, res) => {
  res.statusCode = 200;
  res.end(JSON.stringify(roomManager.createRoom()));
});

// List active game rooms
app.get("/activeRooms", (_req, res) => {
  res.statusCode = 200;
  res.json(roomManager.listActiveRooms());
});

// Defer to SvelteKit's handler
app.use(handler);

// Start the server for socket.io
const envPort = parseInt(process.env.PORT);
const port = (envPort >= 0) ? envPort : 3000;
httpServer.listen(port, () => {
  process.stdout.write(`Damien's Arcade running at http://localhost:${port}\n`);
});
