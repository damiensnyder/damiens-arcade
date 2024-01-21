import type { Fighter, PreseasonTeam, MayhemManagerEvent, MayhemManagerViewpoint } from "$lib/mayhem-manager/types";
import { bracket, draftOrder, fightEvents, gameStage, rawSettings, settings, teams, spotInDraftOrder, fighters, equipment, watchingFight, history, equipmentChoices, ownTeam, ownTeamIndex } from "$lib/mayhem-manager/stores";
import { get } from "svelte/store";
import { roomName, isPublic, host, pov } from "$lib/stores";
import type { ChangeHostEvent, ChangeRoomSettingsEvent, EventHandler } from "$lib/types";

export function handleGamestate(gamestate: MayhemManagerViewpoint): void {
  rawSettings.set(JSON.stringify(gamestate.settings));
  gameStage.set(gamestate.gameStage);
  history.set(gamestate.history);
  teams.set(gamestate.teams);
  if (gamestate.gameStage === "draft" || gamestate.gameStage === "free agency") {
    draftOrder.set(gamestate.draftOrder);
    spotInDraftOrder.set(gamestate.spotInDraftOrder);
    fighters.set(gamestate.fighters);
  } else if (gamestate.gameStage === "tournament") {
    bracket.set(gamestate.bracket);
  }
}

export const eventHandler: EventHandler<MayhemManagerEvent> = {
  changeRoomSettings: function (event: ChangeRoomSettingsEvent & { type: "changeRoomSettings"; }): void {
    roomName.set(event.roomName);
    isPublic.set(event.isPublic);
  },
  changeHost: function (event: ChangeHostEvent & { type: "changeHost"; }): void {
    host.set(event.host);
  },
  changeGameSettings: function (event): void {
    settings.set(event.settings);
    rawSettings.set(JSON.stringify(event.settings));
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
        ready: false,
        ...event
      });
      return old;
    });
  },
  leave: function (event): void {
    teams.update((old) => {
      old[event.team].controller = "bot";
      return old;
    });
  },
  replace: function (event): void {
    teams.update((old) => {
      old[event.team].controller = event.controller;
      return old;
    });
    if (event.controller === get(pov)) {
      equipmentChoices.set(get(ownTeam).equipment.map(_ => -1));
    }
  },
  remove: function (event): void {
    teams.update((old) => {
      old.splice(event.team, 1);
      return old;
    });
  },
  resign: function (event): void {
    teams.update((old) => {
      const team = old[event.team] as PreseasonTeam;
      const fighterResigned = team.needsResigning.splice(event.fighter, 1)[0];
      team.fighters.push(fighterResigned);
      team.money -= fighterResigned.price;
      fighterResigned.price = 0;
      return old;
    });
  },
  repair: function (event): void {
    teams.update((old) => {
      const team = old[event.team] as PreseasonTeam;
      const equipmentRepaired = team.needsRepair.splice(event.equipment, 1)[0];
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
      spotInDraftOrder.update(x => x + 1);
    }
  },
  pass: function (_event): void {
    spotInDraftOrder.update(x => x + 1);
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
    if (get(ownTeamIndex) !== null) {
      equipmentChoices.set(get(ownTeam).equipment.map(_ => -1));
    }
  },
  fight: function (event): void {
    fightEvents.set(event.eventLog);
    watchingFight.set(true);
  },
  bracket: function (event): void {
    gameStage.set("tournament");
    bracket.set(event.bracket);
  },
  goToPreseason: function (event): void {
    watchingFight.set(false);
    fightEvents.set([]);
    history.set(event.history);
    gameStage.set("preseason");
    teams.set(event.teams);
  }
}