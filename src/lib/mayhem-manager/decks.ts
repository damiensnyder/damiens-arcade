import { readFileSync } from "fs";
import { EquipmentSlot, type Abilities, type Appearance, type Color, type Equipment, type EquipmentInBattle, type Fighter, type FighterNames, type FighterStats } from "$lib/mayhem-manager/types";
import type { RNG } from "$lib/types";
import { TICK_LENGTH, type FighterInBattle } from "./battle-logic";



const fighterNames: FighterNames =
    JSON.parse(readFileSync("src/lib/mayhem-manager/data/names.json").toString());

const HAIR_COLORS: Color[] = [
  [[6, 6, 6], [0.1, 0]],
  [[7, 6, 5], [0.1, 0.1]],
  [[21, 10, 8], [0.2, 0.3]],
  [[47, 17, 15], [0.4, 0.4]],
  [[67, 20, 17], [0.5, 0.5]],
  [[90, 15, 10], [0.5, 0.8]],
  [[83, 38, 34], [0.8, 0.3]],
  [[167, 62, 46], [2, 0.5]],
  [[168, 99, 70], [4, 0.4]],
  [[139, 123, 114], [5, 0.1]]
];
const SKIN_COLORS: Color[] = [
  [[63, 7, 2], [0.3, 1]],
  [[90, 15, 10], [0.5, 0.8]],
  [[150, 37, 30], [1, 0.6]],
  [[163, 54, 43], [1.5, 0.5]],
  [[133, 70, 60], [2, 0.3]],
  [[159, 82, 61], [3, 0.4]],
  [[188, 113, 68], [5, 0.5]],
  [[194, 148, 97], [7, 0.4]],
  [[202, 164, 105], [8, 0.4]],
  [[214, 197, 141], [10, 0.3]]
];
export const SHIRT_COLORS: Color[] = [
  [[176, 6, 15], [0, 0.7, 1]],
  [[0, 0, 0], [0, 0, 1]],
  [[12, 9, 89], [255, 0.2, 2]],
  [[3, 55, 4], [120, 0.5, 1]],
  [[54, 54, 54], [0, 10, 0]],
  [[5, 11, 30], [240, 2, 0.5]]
];
export const SHORTS_COLORS: Color[] = [
  [[0, 0, 0], [0, 0, 1]],
  [[1, 14, 89], [240, 0.2, 2]],
  [[3, 47, 86], [200, 0.5, 1]],
  [[252, 13, 27], [0, 10, 1]],
  [[5, 11, 30], [240, 2, 0.5]]
];
const SHOES_COLORS: Color[] = [
  [[91, 31, 31], [0, 0.8, 0.3]],
  [[0, 0, 0], [0, 0, 1]],
  [[126, 3, 8], [0, 0.5, 1]],
  [[5, 11, 30], [240, 0.2, 0.5]],
  [[21, 43, 62], [200, 0.5, 0.5]]
];
const FIGHTER_INIT_STAT_DIST = [
  0, 0, 0, 0, 1, 1, 1, 1, 2, 2,
  2, 2, 2, 3, 3, 3, 3, 4, 4, 4,
  5, 5, 6, 7, 8
];


export interface EquipmentTemplate {
  name: string
  description: string
  flavor: string
  imgUrl: string
  zoomedImgUrl: string
  price: number
  slots: EquipmentSlot[]
  abilities: Abilities
}

export interface FighterTemplate {
  description: string
  flavor: string
  price: number
  abilities: Abilities
}

export function getEquipmentForPick(equipmentKey: string): Equipment {
  const template = equipmentCatalog[equipmentKey];
  return {
    name: template.name,
    slots: template.slots.slice(),
    imgUrl: template.imgUrl,
    zoomedImgUrl: template.zoomedImgUrl,
    price: template.price,
    description: template.description,
    flavor: template.flavor,
    yearsOwned: 0,
    abilityName: equipmentKey
  };
}

export function getEquipmentForBattle(equipmentKey: string, fighter: FighterInBattle): EquipmentInBattle {
  const template = equipmentCatalog[equipmentKey];
  return {
    name: template.name,
    slots: template.slots.slice(),
    imgUrl: template.imgUrl,
    fighter,
    ...template.abilities
  };
}

export function getFighterForPick(fighterKey: string,
    name: string, appearance: Appearance, stats: FighterStats): Fighter {
  const template = fighterAbilitiesCatalog[fighterKey];
  return {
    name,
    appearance,
    stats,
    description: template.description,
    flavor: template.flavor,
    experience: 0,
    price: template.price,
    attunements: [],
    abilityName: fighterKey
  };
}

export function getFighterAbilityForBattle(fighterKey: string, fighter: FighterInBattle): EquipmentInBattle {
  const template = fighterAbilitiesCatalog[fighterKey];
  return {
    name: "",
    slots: [],
    imgUrl: "",
    fighter,
    isFighterAbility: true,
    ...template.abilities
  };
}

export function generateEightEquipment(rng: RNG): Equipment[] {
  const ret: Equipment[] = [];
  const equipmentList = Object.keys(equipmentCatalog);
  for (let i = 0; i < 8; i++) {
    let equipmentPicked = rng.randElement(equipmentList);
    while (equipmentList.length >= 8 && ret.some(e => e.name === equipmentPicked)) {
      equipmentPicked = rng.randElement(equipmentList);
    }
    ret.push(getEquipmentForPick(equipmentPicked));
  }
  return ret;
}

export function generateFighters(amount: number, inFA: boolean, rng: RNG): Fighter[] {
  const ret: Fighter[] = [];
  const fighterAbilitiesList = Object.keys(fighterAbilitiesCatalog);
  for (let i = 0; i < amount; i++) {
    const gender = rng.randElement(["M", "F", "A"]);
    const eligibleFirstNames = (gender === "M" || (gender === "A" && rng.randReal() < 0.5)) ? fighterNames.firstNamesM : fighterNames.firstNamesF;
    const appearance: Appearance = {
      body: `/static/base/body_${gender}1.png`,
      hair: `/static/base/hair_${gender}${rng.randInt(1, 4)}.png`,
      face: `/static/base/face_${rng.randInt(1, 2)}.png`,
      shirt: `/static/base/shirt_${gender}${rng.randInt(1, 2)}.png`,
      shorts: `/static/base/shorts_${gender}1.png`,
      socks: `/static/base/socks_${gender}1.png`,
      shoes: `/static/base/shoes_${gender}1.png`,
      hairColor: rng.randElement(HAIR_COLORS),
      skinColor: rng.randElement(SKIN_COLORS),
      shirtColor: rng.randElement(SHIRT_COLORS),
      shortsColor: rng.randElement(SHORTS_COLORS),
      shoesColor: rng.randElement(SHOES_COLORS)
    };
    const stats: FighterStats = {
      strength: rng.randElement(FIGHTER_INIT_STAT_DIST),
      accuracy: rng.randElement(FIGHTER_INIT_STAT_DIST),
      energy: rng.randElement(FIGHTER_INIT_STAT_DIST),
      speed: rng.randElement(FIGHTER_INIT_STAT_DIST),
      toughness: rng.randElement(FIGHTER_INIT_STAT_DIST)
    };
    ret.push(
      getFighterForPick(
        rng.randReal() < 0.4 ? "noAbilities" : rng.randElement(fighterAbilitiesList),
        rng.randElement(eligibleFirstNames) + " " + rng.randElement(fighterNames.lastNames),
        appearance,
        stats
      )
    )
  }
  return ret;
}



export const equipmentCatalog: Record<string, EquipmentTemplate> = {
  battleAxe: {
    name: "Battle Axe",
    slots: [EquipmentSlot.Hand, EquipmentSlot.Hand],
    imgUrl: "/static/equipment/battle-axe.png",
    zoomedImgUrl: "/static/zoomed/equipment/battle-axe.png",
    price: 32,
    description: "Melee. Deals 70 [attuned: 90] damage. Cooldown 4s.",
    flavor: "learn this secret trick lumberjacks DON'T want you to know",
    abilities: meleeAttackAbility("Battle Axe", 90, 70, 4, 4)
  },
  bow: {
    name: "Bow",
    slots: [EquipmentSlot.Hand, EquipmentSlot.Hand],
    imgUrl: "/static/equipment/bow.png",
    zoomedImgUrl: "/static/zoomed/equipment/bow.png",
    price: 12,
    description: "Ranged. Deals 50 [attuned: 65] damage. Cooldown 5s.",
    flavor: "",
    abilities: rangedAttackAbility("Bow", 65, 50, 5, 5, "/static/projectiles/arrow.png")
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
        healAmount = Math.max(healAmount, 100 - self.fighter.hp);
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
    abilities: rangedAttackAbility("Bow", 50, 40, 2, 2, "/static/projectiles/laser.png")
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
      },
      ...meleeAttackAbility("Roller Blades", 30, 30, 4, 4)
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
    abilities: meleeAttackAbility("Shiv", 20, 20, 2, 1.5)
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



export const fighterAbilitiesCatalog: Record<string, FighterTemplate> = {
  noAbilities: {
    description: "",
    flavor: "",
    price: 0,
    abilities: {}
  }
};



function meleeAttackAbility(
  name: string,
  damageAttuned: number,
  damageUnattuned: number,
  cooldownAttuned: number,
  cooldownUnattuned: number
): Abilities {
  return {
    actionDanger: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      return damage / cooldown * self.fighter.meleeDamageMultiplier();
    },
    getActionPriority: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const dps = damage / cooldown * self.fighter.meleeDamageMultiplier();
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        maxValue = Math.max(self.fighter.valueOfAttack(target, dps, self.fighter.timeToAttack(target)));
      }
      return maxValue;
    },
    whenPrioritized: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const dps = damage / cooldown * self.fighter.meleeDamageMultiplier();
      let bestTarget: FighterInBattle;
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        const value = self.fighter.valueOfAttack(target, dps, self.fighter.timeToAttack(target));
        if (bestTarget === undefined || value > maxValue) {
          bestTarget = target;
          maxValue = value;
        }
      }
      self.fighter.attemptMeleeAttack(bestTarget, damage * self.fighter.meleeDamageMultiplier(), cooldown, 0.5);
    }
  };
}

function rangedAttackAbility(
  name: string,
  damageAttuned: number,
  damageUnattuned: number,
  cooldownAttuned: number,
  cooldownUnattuned: number,
  projectileImg: string
): Abilities {
  return {
    actionDanger: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      return damage / cooldown * self.fighter.rangedHitChance();
    },
    getActionPriority: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const dps = damage / cooldown * self.fighter.rangedHitChance();
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        maxValue = Math.max(self.fighter.valueOfAttack(target, dps, self.fighter.cooldown));
      }
      return maxValue;
    },
    whenPrioritized: (self: EquipmentInBattle) => {
      const damage = self.fighter.attunements.includes(name) ? damageAttuned : damageUnattuned;
      const cooldown = self.fighter.attunements.includes(name) ? cooldownAttuned : cooldownUnattuned;
      const dps = damage / cooldown * self.fighter.rangedHitChance();
      let bestTarget: FighterInBattle;
      let maxValue = 0;
      for (let target of self.fighter.enemies()) {
        const value = self.fighter.valueOfAttack(target, dps, self.fighter.cooldown);
        if (bestTarget === undefined || value > maxValue) {
          bestTarget = target;
          maxValue = value;
        }
      }
      self.fighter.attemptRangedAttack(bestTarget, damage, cooldown, 0.5, projectileImg);
    }
  }
}