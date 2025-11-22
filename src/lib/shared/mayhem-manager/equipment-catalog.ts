import { TICK_LENGTH, EPSILON } from "./fight";
import { FighterInBattle } from "./fighter-in-battle";
import { Abilities, EquipmentInBattle, EquipmentSlot, EquipmentTemplate } from "./types";

export const equipmentCatalog: Record<string, EquipmentTemplate> = {
  battleAxe: {
    name: "Battle Axe",
    slots: [EquipmentSlot.Hand, EquipmentSlot.Hand],
    imgUrl: "/static/equipment/battle-axe.png",
    zoomedImgUrl: "/static/zoomed/equipment/battle-axe.png",
    price: 32,
    description: "Melee. Deals 70 [attuned: 90] damage. Cooldown 4s.",
    flavor: "learn this secret trick lumberjacks DON'T want you to know",
    abilities: meleeAttackAbility("Battle Axe", 70, 90, 4, 4, 0, 0)
  },
  bow: {
    name: "Bow",
    slots: [EquipmentSlot.Hand, EquipmentSlot.Hand],
    imgUrl: "/static/equipment/bow.png",
    zoomedImgUrl: "/static/zoomed/equipment/bow.png",
    price: 12,
    description: "Ranged. Deals 50 [attuned: 65] damage. Cooldown 5s.",
    flavor: "",
    abilities: rangedAttackAbility("Bow", 50, 65, 5, 5, 0, 0, "/static/projectiles/arrow.png")
  },
  cornDog: {
    name: "Corn Dog",
    slots: [EquipmentSlot.Hand],
    imgUrl: "/static/equipment/corn-dog.png",
    zoomedImgUrl: "/static/zoomed/equipment/corn-dog.png",
    price: 12,
    description: "Single-use. Heals 40 [attuned: 60] HP.",
    flavor: "surprisingly nutritious",
    abilities: {
      getActionPriority: (self: EquipmentInBattle) => {
        const healAmount = self.fighter.attunements.includes("Corn Dog") ? 60 : 40;
        return self.fighter.hp < healAmount ? healAmount / 2 / self.fighter.damageTakenMultiplier() : 0;
      },
      whenPrioritized: (self: EquipmentInBattle) => {
        let healAmount = self.fighter.attunements.includes("Corn Dog") ? 60 : 40;
        healAmount = Math.min(healAmount, 100 - self.fighter.hp);
        self.fighter.hp += healAmount;
        self.fighter.cooldown = 2;
        self.fighter.equipment.splice(self.fighter.equipment.indexOf(self), 1);

        self.fighter.logEvent({
          type: "text",
          fighter: self.fighter.index,
          text: healAmount.toString()
        });
        self.fighter.logEvent({
          type: "animation",
          fighter: self.fighter.index,
          updates: {
            hp: self.fighter.hp,
            equipment: self.fighter.equipment.map(e => {
              return {
                name: e.name,
                imgUrl: e.imgUrl,
                slots: e.slots
              };
            })
          }
        });
      }
    }
  },
  devilHorns: {
    name: "Devil Horns",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/devil-horns.png",
    zoomedImgUrl: "/static/zoomed/equipment/devil-horns.png",
    price: 20,
    description: "-2 toughness, +3 [attuned: +4] to all other stats",
    flavor: "",
    abilities: {
      onFightStart: (self: EquipmentInBattle) => {
        self.fighter.stats.strength += 6;
        self.fighter.stats.accuracy += 6;
        self.fighter.stats.energy += 6;
        self.fighter.stats.speed += 6;
        self.fighter.stats.toughness -= 4;
        if (self.fighter.attunements.includes("Devil Horns")) {
          self.fighter.stats.strength += 2;
          self.fighter.stats.accuracy += 2;
          self.fighter.stats.energy += 2;
          self.fighter.stats.speed += 2;
        }
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
  diamondSword: {
    name: "Diamond Sword",
    slots: [EquipmentSlot.Hand],
    imgUrl: "/static/equipment/diamond-sword.png",
    zoomedImgUrl: "/static/zoomed/equipment/diamond-sword.png",
    price: 30,
    description: "Melee. Deals 50 [attuned: 65] damage. Cooldown 3s.",
    flavor: "Durability: 858/1561; Bane of Arthropods IV",
    abilities: meleeAttackAbility("Diamond Sword", 50, 65, 3, 3, 0, 0)
  },
  fairyHat: {
    name: "Fairy Hat",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/fairy-hat.png",
    zoomedImgUrl: "/static/zoomed/equipment/fairy-hat.png",
    price: 17,
    description: "On hit dealt: Freeze the target for 2s [attuned: 3s].",
    flavor: "",
    abilities: {
      passiveDanger: (self: EquipmentInBattle) => {
        return self.fighter.attunements.includes("Fairy Hat") ? 2 : 3;
      },
      onHitDealt: (self: EquipmentInBattle, target: FighterInBattle, _damage: number, _equipmentUsed: EquipmentInBattle) => {
        target.stats.speed -= 4;
        target.statusEffects.push({
          name: "frozen",
          duration: target.attunements.includes("Fairy Hat") ? 3 : 2,
          tint: [0.5, 0.7, 1, 0.3],
          onClear: (f: FighterInBattle) => {
            f.stats.speed += 4;
            self.fighter.logEvent({
              type: "animation",
              fighter: target.index,
              updates: {
                stats: target.stats,
                tint: target.tint()
              }
            });
          }
        });
        self.fighter.logEvent({
          type: "animation",
          fighter: target.index,
          updates: {
            stats: target.stats,
            tint: target.tint()
          }
        });
      }
    }
  },
  flamingoFloaty: {
    name: "Flamingo Floaty",
    slots: [EquipmentSlot.Legs],
    imgUrl: "/static/equipment/flamingo-floaty.png",
    zoomedImgUrl: "/static/zoomed/equipment/flamingo-floaty.png",
    price: 5,
    description: "On hit taken: Prevent all damage. Remove Flamingo Floaty.",
    flavor: "*pop!*",
    abilities: {
      onHitTaken: (self: EquipmentInBattle, _attacker: FighterInBattle, damage: number, _equipmentUsed: EquipmentInBattle) => {
        self.fighter.hp += damage;
        self.fighter.equipment.splice(self.fighter.equipment.indexOf(self), 1);
        self.fighter.flash = 0;
      }
    }
  },
  frillySkirt: {
    name: "Frilly Skirt",
    slots: [EquipmentSlot.Legs],
    imgUrl: "/static/equipment/frilly-skirt.png",
    zoomedImgUrl: "/static/zoomed/equipment/frilly-skirt.png",
    price: 24,
    description: "Makes opponents much less likely to target the wearer.",
    flavor: "you wouldn't hit someone in a frilly little skirt, would you?",
    abilities: {
      passiveDanger: (_self: EquipmentInBattle) => {
        return -1000000;
      }
    }
  },
  fullSuitOfArmor: {
    name: "Full Suit of Armor",
    slots: [EquipmentSlot.Head, EquipmentSlot.Legs, EquipmentSlot.Feet],
    imgUrl: "/static/equipment/full-suit-of-armor.png",
    zoomedImgUrl: "/static/zoomed/equipment/full-suit-of-armor.png",
    price: 15,
    description: "+6 [attuned: +7.5] toughness, -1.5 speed",
    flavor: "clank. clank. clank. clank",
    abilities: {
      onFightStart: (self: EquipmentInBattle) => {
        self.fighter.stats.toughness += 12;
        self.fighter.stats.speed -= 3;
        if (self.fighter.attunements.includes("Full Suit of Armor")) {
          self.fighter.stats.toughness += 3;
        }
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
  jellyhat: {
    name: "Jellyhat",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/jellyhat.png",
    zoomedImgUrl: "/static/zoomed/equipment/jellyhat.png",
    price: 18,
    description: "On hit taken: The attacker loses 10 HP.",
    flavor: "",
    abilities: {
      onHitTaken: (self: EquipmentInBattle, attacker: FighterInBattle, _damage: number, _equipmentUsed: EquipmentInBattle) => {
        attacker.hp -= 10;
        self.fighter.logEvent({
          type: "animation",
          fighter: attacker.index,
          updates: {
            hp: attacker.hp
          }
        });
        self.fighter.logEvent({
          type: "text",
          fighter: attacker.index,
          text: "10"
        });
      }
    }
  },
  laserBlaster: {
    name: "Laser Blaster",
    slots: [EquipmentSlot.Hand],
    imgUrl: "/static/equipment/laser-blaster.png",
    zoomedImgUrl: "/static/zoomed/equipment/laser-blaster.png",
    price: 25,
    description: "Ranged. Deals 40 [attuned: 50] damage. Cooldown 2s.",
    flavor: "",
    abilities: rangedAttackAbility("Bow", 40, 50, 2, 2, 0, 0, "/static/projectiles/laser.png")
  },
  rhinocerosBeetleHorn: {
    name: "Rhinoceros Beetle Horn",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/rhinoceros-beetle-horn.png",
    zoomedImgUrl: "/static/zoomed/equipment/rhinoceros-beetle-horn.png",
    price: 10,
    description: "On hit dealt: Gain +1 [attuned: +1.5] strength.",
    flavor: "the rhinoceros beetle is the strongest creature on earth",
    abilities: {
      onHitDealt: (self: EquipmentInBattle, _target: FighterInBattle, _damage: number, _equipmentUsed: EquipmentInBattle) => {
        self.fighter.stats.strength += 2;
        if (self.fighter.attunements.includes("Rhinoceros Beetle Horn")) {
          self.fighter.stats.strength += 1;
        }
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
  rollerBlades: {
    name: "Roller Blades",
    slots: [EquipmentSlot.Feet],
    imgUrl: "/static/equipment/roller-blades.png",
    zoomedImgUrl: "/static/zoomed/equipment/roller-blades.png",
    price: 23,
    description: "Melee. Deals 30 damage. Cooldown 4s. +2 [attuned: +3] speed",
    flavor: "",
    abilities: {
      onFightStart: (self: EquipmentInBattle) => {
        self.fighter.stats.toughness += 4;
        if (self.fighter.attunements.includes("Roller Blades")) {
          self.fighter.stats.toughness += 2;
        }
        self.fighter.logEvent({
          type: "animation",
          fighter: self.fighter.index,
          updates: {
            stats: self.fighter.stats
          }
        });
      },
      ...meleeAttackAbility("Roller Blades", 30, 30, 4, 4, 0, 0)
    }
  },
  shield: {
    name: "Shield",
    slots: [EquipmentSlot.Hand],
    imgUrl: "/static/equipment/shield.png",
    zoomedImgUrl: "/static/zoomed/equipment/shield.png",
    price: 15,
    description: "+3 [attuned: +4] toughness",
    flavor: "",
    abilities: {
      onFightStart: (self: EquipmentInBattle) => {
        self.fighter.stats.toughness += 6;
        if (self.fighter.attunements.includes("Shield")) {
          self.fighter.stats.toughness += 2;
        }
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
  shiv: {
    name: "Shiv",
    slots: [EquipmentSlot.Hand],
    imgUrl: "/static/equipment/shiv.png",
    zoomedImgUrl: "/static/zoomed/equipment/shiv.png",
    price: 20,
    description: "Melee. Deals 20 damage. Cooldown 2s [attuned: 1.5s].",
    flavor: "",
    abilities: meleeAttackAbility("Shiv", 20, 20, 2, 1.5, 0, 0)
  },
  snowmanHead: {
    name: "Snowman Head",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/snowman-head.png",
    zoomedImgUrl: "/static/zoomed/equipment/snowman-head.png",
    price: 22,
    description: "Ranged. Deals 10 damage. Cooldown 1s. On hit dealt: Freeze the target for 1s [attuned: 2s].",
    flavor: "the snowman's revenge",
    abilities: {
      ...rangedAttackAbility("Snowman Head", 10, 10, 1, 1, 0, 0, "/static/projectiles/snowball.png"),
      // TODO: make this attack higher priority
      onHitDealt: (self: EquipmentInBattle, target: FighterInBattle, _damage: number, equipmentUsed: EquipmentInBattle) => {
        if (equipmentUsed === self) {
          target.stats.speed -= 2;
          target.statusEffects.push({
            name: "frozen",
            duration: target.attunements.includes("Snowman Head") ? 2 : 1,
            tint: [0.5, 0.7, 1, 0.3],
            onClear: (f: FighterInBattle) => {
              f.stats.speed += 4;
              self.fighter.logEvent({
                type: "animation",
                fighter: target.index,
                updates: {
                  stats: target.stats,
                  tint: target.tint()
                }
              });
            }
          });
          self.fighter.logEvent({
            type: "animation",
            fighter: target.index,
            updates: {
              stats: target.stats,
              tint: target.tint()
            }
          });
        }
      }
    }
  },
  sportsJersey: {
    name: "Sports Jersey",
    slots: [EquipmentSlot.Torso],
    imgUrl: "/static/equipment/sports-jersey.png",
    zoomedImgUrl: "/static/zoomed/equipment/sports-jersey.png",
    price: 9,
    description: "+2 [attuned: +3] to all stats for each other teammate wearing a Sports Jersey.",
    flavor: "teamwork? i sure hope it does!",
    abilities: {
      onFightStart: (self: EquipmentInBattle) => {
        for (let f of self.fighter.teammates()) {
          if (f !== self.fighter && f.equipment.some(e => e.name === "Sports Jersey")) {
            self.fighter.stats.strength += 4;
            self.fighter.stats.accuracy += 4;
            self.fighter.stats.energy += 4;
            self.fighter.stats.speed += 4;
            self.fighter.stats.toughness += 4;
            if (self.fighter.attunements.includes("Sports Jersey")) {
              self.fighter.stats.strength += 2;
              self.fighter.stats.accuracy += 2;
              self.fighter.stats.energy += 2;
              self.fighter.stats.speed += 2;
              self.fighter.stats.toughness += 2;
            }
            self.fighter.logEvent({
              type: "animation",
              fighter: self.fighter.index,
              updates: {
                stats: self.fighter.stats
              }
            });
          }
        }
      }
    }
  },
  vikingHelmet: {
    name: "Viking Helmet",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/viking-helmet.png",
    zoomedImgUrl: "/static/zoomed/equipment/viking-helmet.png",
    price: 11,
    description: "+1.5 [attuned: +2] strength and toughness",
    flavor: "",
    abilities: {
      onFightStart: (self: EquipmentInBattle) => {
        self.fighter.stats.strength += 3;
        self.fighter.stats.toughness += 3;
        if (self.fighter.attunements.includes("Viking Helmet")) {
          self.fighter.stats.strength += 1;
          self.fighter.stats.toughness += 1;
        }
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
  wandOfFlames: {
    name: "Wand of the Great Pyromaniac",
    slots: [EquipmentSlot.Hand],
    imgUrl: "/static/equipment/wand-of-flames.png",
    zoomedImgUrl: "/static/zoomed/equipment/wand-of-flames.png",
    price: 40,
    description: "Ranged. Deals 40 [attuned: 50] damage to all enemies. Requires 2 charges. Cooldown 1s.",
    flavor: "the Great Pyromaniac might have been a little *too* great",
    abilities: aoeAttackAbility("Wand of Flames", 40, 50, 1, 1, 2, 2, "/static/projectiles/fireball.png")
  },
  zapHelmet: {
    name: "Zap Helmet",
    slots: [EquipmentSlot.Head],
    imgUrl: "/static/equipment/zap-helmet.png",
    zoomedImgUrl: "/static/zoomed/equipment/zap-helmet.png",
    price: 25,
    description: "Every 3s, deals 15 [attuned: 20] damage to the nearest enemy fighter.",
    flavor: "",
    abilities: {
      passiveDanger: (self: EquipmentInBattle) => {
        return self.fighter.attunements.includes("Zap Helmet") ? 20/3 : 15/3;
      },
      onFightStart: (self: EquipmentInBattle) => {
        self.state = 0;
      },
      onTick: (self: EquipmentInBattle) => {
        self.state += TICK_LENGTH;
        if (self.state >= 3) {
          self.state = 0;
          let bestTarget: FighterInBattle;
          let minDistance = Infinity;
          for (let target of self.fighter.enemies()) {
            const distance = self.fighter.distanceTo(target);
            if (distance < minDistance) {
              bestTarget = target;
              minDistance = distance;
            }
          }
          
          self.fighter.logEvent({
            type: "projectile",
            fighter: self.fighter.index,
            target: bestTarget.index,
            projectileImg: "/static/projectiles/laser.png"
          });
          let damage = (self.fighter.attunements.includes("Zap Helmet") ? 20 : 15) * bestTarget.damageTakenMultiplier();
          damage = Math.ceil(damage);
          bestTarget.hp -= damage;
          bestTarget.flash = 1;
  
          // log the hit with animation info
          self.fighter.logEvent({
            type: "animation",
            fighter: bestTarget.index,
            updates: {
              hp: bestTarget.hp,
              flash: bestTarget.flash
            }
          });
          self.fighter.logEvent({
            type: "text",
            fighter: bestTarget.index,
            text: damage.toString()
          });
          self.fighter.logEvent({
            type: "particle",
            fighter: bestTarget.index,
            particleImg: "/static/damage.png"
          });
        }
      }
    }
  },
};



export function meleeAttackAbility(
  name: string,
  damageUnattuned: number,
  damageAttuned: number,
  cooldownUnattuned: number,
  cooldownAttuned: number,
  chargeNeededUnattuned: number,
  chargeNeededAttuned: number
): Abilities {
  return {
    actionDanger: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      return damage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.meleeDamageMultiplier();
    },
    getActionPriority: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      const dps = damage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.meleeDamageMultiplier();
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        maxValue = Math.max(self.fighter.valueOfAttack(target, dps, self.fighter.timeToAttack(target, chargeNeeded)));
      }
      return maxValue;
    },
    whenPrioritized: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      const dps = damage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.meleeDamageMultiplier();
      let bestTarget: FighterInBattle;
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        const value = self.fighter.valueOfAttack(target, dps, self.fighter.timeToAttack(target, chargeNeeded));
        if (bestTarget === undefined || value > maxValue) {
          bestTarget = target;
          maxValue = value;
        }
      }
      self.fighter.attemptMeleeAttack(bestTarget, self, damage * self.fighter.meleeDamageMultiplier(), cooldown, 0.5, chargeNeeded);
    }
  };
}

export function rangedAttackAbility(
  name: string,
  damageUnattuned: number,
  damageAttuned: number,
  cooldownUnattuned: number,
  cooldownAttuned: number,
  chargeNeededUnattuned: number,
  chargeNeededAttuned: number,
  projectileImg: string
): Abilities {
  return {
    actionDanger: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      return damage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.rangedHitChance();
    },
    getActionPriority: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      const chargeCooldownRemaining = Math.max(0, chargeNeeded - self.fighter.charges) * self.fighter.timeToCharge();
      const dps = damage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.rangedHitChance();
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        maxValue = Math.max(self.fighter.valueOfAttack(target, dps, self.fighter.cooldown + chargeCooldownRemaining));
      }
      return maxValue;
    },
    whenPrioritized: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      const chargeCooldownRemaining = Math.max(0, chargeNeeded - self.fighter.charges) * self.fighter.timeToCharge();
      const dps = damage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.rangedHitChance();
      let bestTarget: FighterInBattle;
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        const value = self.fighter.valueOfAttack(target, dps, self.fighter.cooldown + chargeCooldownRemaining);
        if (bestTarget === undefined || value > maxValue) {
          bestTarget = target;
          maxValue = value;
        }
      }
      self.fighter.attemptRangedAttack(bestTarget, self, damage, cooldown, 0.5, chargeNeeded, projectileImg);
    }
  }
}

export function aoeAttackAbility(
  name: string,
  damageUnattuned: number,
  damageAttuned: number,
  cooldownUnattuned: number,
  cooldownAttuned: number,
  chargeNeededUnattuned: number,
  chargeNeededAttuned: number,
  projectileImg: string
): Abilities {
  return {
    actionDanger: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      let totalDamage = 0;
      for (let target of self.fighter.enemies()) {
        totalDamage += Math.min(damage * target.damageTakenMultiplier(), target.hp);
      }
      return totalDamage / (cooldown + chargeNeeded * self.fighter.timeToCharge());
    },
    getActionPriority: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      let totalDamage = 0;
      for (let target of self.fighter.enemies()) {
        totalDamage += Math.min(damage * target.damageTakenMultiplier(), target.hp);
      }
      const chargeCooldownRemaining = Math.max(0, chargeNeeded - self.fighter.charges) * self.fighter.timeToCharge();
      const dps = totalDamage / (cooldown + chargeNeeded * self.fighter.timeToCharge()) * self.fighter.rangedHitChance();
      let totalValue = 0;
      for (let target of self.fighter.enemies()) {
        totalValue += self.fighter.valueOfAttack(target, dps, self.fighter.cooldown + chargeCooldownRemaining);
      }
      return totalValue;
    },
    whenPrioritized: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const chargeNeeded = self.fighter.attunements.includes(name) ? chargeNeededAttuned : chargeNeededUnattuned;
      self.fighter.attemptAoeAttack(self.fighter.enemies(), self, damage, cooldown, 0.5, chargeNeeded, projectileImg);
    }
  }
}