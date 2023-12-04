import json
import numpy as np


with open("src/lib/test/mayhem-manager/fight-sample.json") as f:
    results = json.load(f)

equipment = set()
for fight in results:
    for team in fight['teams']:
        for fighter in team['fighters']:
            for e in fighter['attunements']:
                equipment.add(e)
all_stats = ["strength", "accuracy", "energy", "speed", "toughness"] + sorted(list(equipment))


# Score each team based on how well they performed in that fight.
def team_scores(result):
    scores = [0 for _ in range(len(result['ordering']))]
    i = 0
    for team_index, team in enumerate(result['teams']):
        hp_on_team = 0
        fighters_on_team = 0
        for _ in team['fighters']:
            hp_on_team += max(result['hp'][i], 0)
            fighters_on_team += 1
            i += 1
        if hp_on_team > 0:
            scores[team_index] = len(result['ordering']) + hp_on_team / (fighters_on_team * 100)
        else:
            scores[team_index] = len(result['ordering']) - result['ordering'].index(team_index)
    mean = sum(scores) / len(scores)
    scores = [round(s - mean, 3) for s in scores]
    return scores


# convert a duel into a set of easily usable metrics (duel meaning 2 teams fighting only against each other)
def process_team(team):
    team_inputs = {
        e: 0
        for e in all_stats
    }
    for f in team['fighters']:
        for stat in f['stats']:
            team_inputs[stat] += f['stats'][stat]
    for e in team['equipment'][0]:
        team_inputs[e] += 1
    return (
        [len(team['fighters'])] +
        [team_inputs[stat] for stat in team_inputs]
    )


# convert a duel into a set of easily usable metrics (duel meaning 2 teams fighting only against each other)
def process_duel(duel):
    scores = team_scores(duel)
    inputs = [process_team(team) for team in duel['teams']]
    return [[scores[0], 1] + inputs[0] + inputs[1], [scores[1], 1] + inputs[1] + inputs[0]]


# convert a duel into a set of easily usable metrics (duel meaning 2 teams fighting only against each other)
def process_br(br):
    scores = team_scores(br)
    inputs = [process_team(team) for team in br['teams']]
    return [[scores[i], 1] + inputs[i][1:] for i in range(len(scores))]


duels = []
brs = []
for r in results:
    if len(r['teams']) == 2:
        duels += process_duel(r)
    else:
        brs += process_br(r)

duels = np.matrix(duels)
brs = np.matrix(brs)

duels_x = np.array(duels[:, 1:])
duels_y = np.array(duels[:, 0])
duels_y = duels_y / np.std(duels_y)
brs_x = np.array(brs[:, 1:])
brs_y = np.array(brs[:, 0])
brs_y = brs_y / np.std(brs_y)

duels_sol = np.linalg.lstsq(duels_x, duels_y, rcond=None)[0]
brs_sol = np.linalg.lstsq(brs_x, brs_y, rcond=None)[0]


PRINT_COEFFS = True
if PRINT_COEFFS:
    print("DUEL STAT".ljust(28) + "INFLUENCE   MEAN")
    for i, stat in enumerate(["base", "number of fighters"] + all_stats):
        temp = float(duels_sol[i])
        print(f"{stat:<33}{temp:>4.0%}   {np.mean(duels_x[:, i]):.2f}")
    print()

    print("BR STAT".ljust(28) + "INFLUENCE   MEAN")
    for i, stat in enumerate(["base"] + all_stats):
        temp = float(brs_sol[i])
        print(f"{stat:<33}{temp:>4.0%}   {np.mean(brs_x[:, i]):.2f}")
    print()

# print(np.corrcoef(duels_x[:, 0], duels_y[:, 0]))