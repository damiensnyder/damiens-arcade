import { readFileSync } from "fs";
import type { AbilityHaver, Equipment, EquipmentSlot, FighterNames } from "$lib/mayhem-manager/types";

export const fighterNames: FighterNames =
    JSON.parse(readFileSync("src/lib/mayhem-manager/data/names.json").toString());


let x = {
  "name": "Battle Axe",
  "slots": ["hand", "hand"],
  "imgUrl": "/static/equipment/battle-axe.png",
  "zoomedImgUrl": "/static/zoomed/equipment/battle-axe.png",
  "price": 32,
  "description": "Melee. Deals 70 damage. Cooldown 5s.",
  "flavor": "learn this one secret trick lumberjacks DON'T want you to know",
  "abilities": {
    "action": {
      "target": "melee",
      "effects": [
        {
          "type": "damage",
          "amount": 70
        }
      ],
      "cooldown": 5,
      "dodgeable": true,
      "knockback": 0.7,
      "animation": "swing"
    },
    "aiHints": {
      "actionDanger": 14,
      "actionStat": "strength"
    }
  }
}

export const equipmentCatalog: Record<string, Equipment> = {

};

export const fighterAbilitiesCatalog: Record<string, AbilityHaver> = {

}

export const equipmentPool = [];

export const fighterAbilitiesPool = [];