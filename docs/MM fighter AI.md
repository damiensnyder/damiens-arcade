Possible actions a fighter can take:

- Run towards an enemy
- Run away from the nearest enemy
- Use an action ability
- Charge

Whether a fighter prefers to engage, run away, or do neither is based on
effective distance and relative "engageability", which in turn is based on
effective HP and dangerousness.

effective HP = HP * (0.75 + toughness / 20) / (1 - speed / 50)
dangerousness = best threat * (0.5 + relevant stat / 10) + charges * charge threat
engageability = (50 + 10 * danger) / (50 + effective HP)
effective distance = distance / (0.5 + speed / 10)

Best threat is defined by the threat level and charge level of the best
available action ability based on the dangerousness formula.

When choosing which action ability to actually use, fighters will adjust the
preferability of an action depending on its type:

- Melee gets a bonus when engaged and a minus for effective distance
- Attacks requiring charges will only be used if the charges are available

An action ability is then selected, and the action selected is based on the
action ability:

- When a melee attack is chosen, the fighter will attack if in range; otherwise
    the fighter will run toward the most engageable enemy.
- When a ranged attack is chosen, the fighter will run away if they are 1.5x
    more engageable than the enemy they are engaged with *and* they are faster
    than that enemy; otherwise they will use the ranged attack against the most
    engageable enemy.
- When an ability requiring charges is chosen, the ability will be used if the
    fighter has enough charges. Otherwise, the fighter will run away if they are
    1.5x more engageable than the enemy they are engaged with *and* they are
    faster than that enemy. Otherwise, the fighter will charge.