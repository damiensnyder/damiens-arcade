// hooks.server.js
import { Server } from 'socket.io';
import RoomManager from '$lib/backend/room-manager';

/** @type {import('@sveltejs/kit').Handle} */
export const handle = async ({ event, resolve }) => {
  console.log("Hooks ran!");
  // Initialize once when server starts
  if (!global.io || !global.roomManager) {
    console.log("Hooks initialized!");
    const server = event.platform.server;
    global.io = new Server(server);
    global.roomManager = new RoomManager(global.io);
    
    // // Set up test rooms if needed
    // import('$lib/test/set-up-test-rooms.js').then(({ default: setUpTestRooms }) => {
    //   setUpTestRooms(global.roomManager);
    // });
  }
  
  return resolve(event);
};