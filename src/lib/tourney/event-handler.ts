import type { Fighter, PreseasonTeam, TourneyEvent, TourneyViewpoint } from "$lib/tourney/types";
import { bracket, draftOrder, fightEvents, gameStage, rawSettings, settings, teams, spotInDraftOrder, fighters, map, equipment, watchingFight } from "$lib/tourney/stores";
import { get } from "svelte/store";
import { eventLog, pov } from "$lib/stores";
import type { EventHandler } from "$lib/types";

export function switchToType(): void {
  rawSettings.set(`{
    fighterDecks: ["default"],
    equipmentDecks: ["default"],
    mapDecks: ["default"],
    customFighters: [],
    customEquipment: [],
    customMaps: []
  }`);
  settings.set({
    fighterDecks: [],
    equipmentDecks: [],
    mapDecks: [],
    customFighters: [],
    customEquipment: [],
    customMaps: []
  });
  gameStage.set("pregame");
  teams.set([]);
}

export function handleGamestate(gamestate: TourneyViewpoint): void {
  rawSettings.set(JSON.stringify(gamestate.settings));
  gameStage.set(gamestate.gameStage);
  if (gamestate.gameStage !== "pregame") {
    teams.set(gamestate.teams);
    if (gamestate.gameStage === "draft" || gamestate.gameStage === "free agency") {
      draftOrder.set(gamestate.draftOrder);
      spotInDraftOrder.set(gamestate.spotInDraftOrder);
      fighters.set(gamestate.fighters);
    } else if (gamestate.gameStage === "tournament") {
      bracket.set(gamestate.bracket);
    }
  }
}

export const eventHandler: EventHandler<TourneyEvent> = {
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
        needsResigning: [],
        needsRepair: [],
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
  },
  resign: function (event): void {
    teams.update((old) => {
      const team = old[event.team] as PreseasonTeam;
      const fighterResigned = team.needsResigning.splice(event.fighter)[0];
      team.fighters.push(fighterResigned);
      team.money -= fighterResigned.price;
      return old;
    });
  },
  repair: function (event): void {
    teams.update((old) => {
      const team = old[event.team] as PreseasonTeam;
      const equipmentRepaired = team.needsRepair.splice(event.equipment)[0];
      team.equipment.push(equipmentRepaired);
      team.money -= equipmentRepaired.price;
      return old;
    });
  },
  goToDraft: function (event): void {
    gameStage.set("draft");
    draftOrder.set(event.draftOrder);
    spotInDraftOrder.set(0);
    fighters.set(event.fighters);
  },
  pick: function (event): void {
    let fighterPicked: Fighter;
    fighters.update((old) => {
      fighterPicked = old.splice(event.fighter, 1)[0];
      return old;
    });
    teams.update((old) => {
      const teamThatPicked = old[get(draftOrder)[get(spotInDraftOrder)]];
      teamThatPicked.fighters.push(fighterPicked);
      if (typeof fighterPicked.price === "number") {
        teamThatPicked.money -= fighterPicked.price;
      }
      return old;
    });
    if (get(gameStage) === "draft") {
      spotInDraftOrder.update(x => x+1);
    }
  },
  pass: function (_event): void {
    spotInDraftOrder.update(x => x+1);
  },
  goToFA: function (event): void {
    gameStage.set("free agency");
    fighters.set(event.fighters);
    draftOrder.update(old => old.reverse());
    spotInDraftOrder.set(0);
  },
  goToTraining: function (event): void {
    gameStage.set("training");
    equipment.set(event.equipment || []);
  },
  goToBR: function (event): void {
    gameStage.set("battle royale");
    teams.set(event.teams);
  },
  fight: function (event): void {
    map.set(event.map);
    fightEvents.set(event.eventLog);
    // don't stop showing the fight screen till 3 seconds after the fight will finish showing
    // 200 ms per tick
    watchingFight.set(true);
    setTimeout(() => {
      watchingFight.set(false);
    }, event.eventLog.length * 200 + 3000);
  },
  bracket: function (event): void {
    gameStage.set("tournament");
    bracket.set(event.bracket);
    map.set(null);
  },
  goToPreseason: function (event): void {
    gameStage.set("preseason");
    teams.set(event.teams);
  }
}