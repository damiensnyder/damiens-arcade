import { EPSILON } from "$lib/mayhem-manager/fight";
import { meleeAttackAbility } from "$lib/mayhem-manager/equipment-catalog";
import { FighterInBattle } from "$lib/mayhem-manager/fighter-in-battle";
import type { FighterTemplate, EquipmentInBattle } from "$lib/mayhem-manager/types";

export const fighterAbilitiesCatalog: Record<string, FighterTemplate> = {
    noAbilities: {
      description: "",
      flavor: "",
      price: 0,
      abilities: {}
    },
    extraDamageOnHit: {
      description: "On hit dealt: Target loses 5 extra HP.",
      flavor: "just has a little more \"oomph\"",
      price: 15,
      abilities: {
        onHitDealt: (self: EquipmentInBattle, target: FighterInBattle, _damage: number, _equipmentUsed: EquipmentInBattle) => {
          target.hp -= 5;
          self.fighter.logEvent({
            type: "animation",
            fighter: target.index,
            updates: {
              hp: target.hp
            }
          });
          self.fighter.logEvent({
            type: "text",
            fighter: target.index,
            text: "5"
          });
        }
      }
    },
    gainStrengthOnHitTaken: {
      description: "On hit taken: Gain 1 strength.",
      flavor: "",
      price: 8,
      abilities: {
        onHitTaken: (self: EquipmentInBattle, _attacker: FighterInBattle, _damage: number, _equipmentUsed: EquipmentInBattle) => {
          self.fighter.stats.strength += 1;
          self.fighter.logEvent({
            type: "animation",
            fighter: self.fighter.index,
            updates: {
              stats: self.fighter.stats
            }
          });
        }
      }
    },
    powerfulFists: {
      description: "Fists deal double damage.",
      flavor: "",
      price: 10,
      abilities: meleeAttackAbility("", 24, 24, 2.4, 2.4, 0, 0)
    },
    shorterCooldowns: {
      description: "All cooldowns are 0.2s shorter.",
      flavor: "",
      price: 5,
      abilities: {
        onTick: (self: EquipmentInBattle) => {
          if (self.fighter.cooldown <= 0.2 + EPSILON) {
            self.fighter.cooldown = 0;
          }
        }
      }
    },
  };