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

// Create a game room
app.post("/create-room/:gameType", (req, res) => {
  if (req.params.gameType === "auction-tic-tac-toe" ||
      req.params.gameType === "mayhem-manager") {
    res.statusCode = 200;
    res.end(JSON.stringify(roomManager.createRoom(req.params.gameType)));
  } else {
    res.statusCode = 400;
    res.end();
  }
});

// List active game rooms
app.get("/active-rooms", (_req, res) => {
  res.statusCode = 200;
  res.json(roomManager.listActiveRooms());
});

app.get("/game/:roomCode", (req, res, _next) => {
  const gameType = roomManager.getGameTypeOfRoom(req.params.roomCode);
  if (gameType === null) {
    res.redirect("/");
  } else {
    res.redirect(302, `/${gameType.replaceAll(" ", "-").toLowerCase()}/${req.params.roomCode}`);
  }
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
