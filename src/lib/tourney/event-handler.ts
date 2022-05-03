import type { Settings, TourneyEvent, TourneyViewpoint } from "$lib/tourney/types";
import { gameStage, teams, rawSettings, settings } from "$lib/tourney/stores";
import { get } from "svelte/store";
import { eventLog, pov } from "$lib/stores";

export function switchToType(): void {
  rawSettings.set("{}");
  settings.set({});
  gameStage.set("pregame");
  teams.set([]);
}

export function handleGamestate(gamestate: TourneyViewpoint): void {
  rawSettings.set(JSON.stringify(gamestate.settings));
  gameStage.set(gamestate.gameStage);
  teams.set(gamestate.teams);
}

type TourneyEventHandler = {
  [key in TourneyEvent["type"]]: (event: TourneyEvent & { type: key }) => void;
};

export const eventHandler: TourneyEventHandler = {
  join: function (event): void {
    teams.update((old) => {
      delete event.type;
      old.push({
        money: 0,
        fighters: [],
        equipment: [],
        ...event
      });
      return old;
    });
    eventLog.append(`A player has joined.`);
  },
  leave: function (event): void {
    teams.update((old) => {
      old[event.team].controller = "bot";
      return old;
    });
    eventLog.append(`The player playing team ${event.team} has left.`);
  },
  changeGameSettings: function (event): void {
    settings.set(event.settings);
    rawSettings.set(JSON.stringify(event.settings));
  },
  start: function (_event): void {
    gameStage.set("draft");
  }
}