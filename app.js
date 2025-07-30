import { createServer } from "http";
import Express from "express";
import { Server } from "socket.io";

import { handler } from "./target/handler.js";
import RoomManager from "./dist/room-manager.js";

const app = Express();
app.use(Express.json());

const httpServer = createServer(app);
const io = new Server(httpServer);
const roomManager = new RoomManager(io);

// Create auction tic-tac-toe game room
app.post("/auction-tic-tac-toe/create-room", (_req, res) => {
  res.statusCode = 200;
  res.end(JSON.stringify(roomManager.createRoom("auction-tic-tac-toe")));
});

// Create mayhem manager game room
app.post("/mayhem-manager/create-room", (_req, res) => {
  res.statusCode = 200;
  res.end(JSON.stringify(roomManager.createRoom("mayhem-manager")));
});

app.use("/static", Express.static("static"));

// Defer to SvelteKit's handler
app.use(handler);

// Start the server for socket.io
const envPort = parseInt(process.env.PORT);
const port = (envPort >= 0) ? envPort : 3000;
httpServer.listen(port, () => {
  process.stdout.write(`Damien's Arcade running at http://localhost:${port}\n`);
});
