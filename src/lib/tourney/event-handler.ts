import type { Settings, TourneyEvent, TourneyViewpoint } from "$lib/tourney/types";
import { gameStage, rawSettings, settings, teams } from "$lib/tourney/stores";
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
  if (gamestate.gameStage !== "pregame") {
    teams.set(gamestate.teams);
  }
}

type TourneyEventHandler = {
  [key in TourneyEvent["type"]]: (event: TourneyEvent & { type: key }) => void;
};

export const eventHandler: TourneyEventHandler = {
  changeGameSettings: function (event): void {
    settings.set(event.settings);
    rawSettings.set(JSON.stringify(event.settings));
  },
  start: function (_event): void {
    gameStage.set("preseason");
    teams.set([]);
  },
  join: function (event): void {
    teams.update((old) => {
      delete event.type;
      old.push({
        money: 100,
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
  replace: function (event): void {
    teams.update((old) => {
      eventLog.append(`A new player has taken over team ${old[event.team].name}.`);
      old[event.team].controller = event.controller;
      return old;
    });
  },
  remove: function (event): void {
    teams.update((old) => {
      eventLog.append(`Team ${old[event.team].name} has been removed.`);
      old.splice(event.team, 1);
      return old;
    });
  }
}