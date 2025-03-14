import { GameType } from "$lib/types";
import { json, RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request }) => {
  if (!global.roomManager) {
    console.warn("No room manager");
    return new Response();
  }
  return json(global.roomManager.createRoom(GameType.AuctionTTT));
};