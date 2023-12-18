Decisions are based on an evaluation of how strong each individual fighter is.
Which comes down to their dangerousness and effective HP as discussed in the
fighter AI doc. Age is considered, but does not limit individual fighter
quality; it rather impacts a "total age factor" across the team.

Unspent dollars also have value in team quality terms. Let's call this "money
value". This value is TBD, but decreases over the course of the season:

- Preseason: 1x
- Free agency: 0.8x
- Training: 0.5x

In every stage, decisions are made to maximize this formula, assuming optimal
equipment assignment:

team quality = sum(fighter quality) + total age factor + money value * money

I think it would be computationally taxing to check every possibility for what
to pick and how to assign equipment, but I suspect a good approximation for
both parts of that can be found using a (semi-)greedy algorithm.