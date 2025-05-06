import json


with open("analysis/realness.json") as f:
    realness = json.load(f)

with open("analysis/grids.json") as f:
    good = json.load(f)

def write():
    with open("analysis/realness.json", "w") as f:
        json.dump(realness, f)

def is_possible(word, letters):
    if len(word) < 3:
        return False
    for letter in "abcdefghijklmnopqrstuvwxyz":
        if word.count(letter) > letters.count(letter):
            return False
    return True

def get_possible(letters, threshold=5):
    return [
        word for word in realness
        if (realness[word] >= threshold) and is_possible(word, letters)
    ]

def prioritize(letters, threshold=5):
    words = get_possible(letters, threshold)
    available = {
        letter: letters.count(letter) for letter in letters
    }
    avg_occurrence = sum([len(w) for w in words]) / len(set([l for l in letters]))
    need = {
        letter: avg_occurrence - sum([w.count(letter) for w in words]) / available[letter] for letter in available
    }
    return sorted(words,
                  key=lambda w: sum([need[l] for l in w]),
                  reverse = True)

def can_intersect(test_index, with_index, test_word, with_word):
    return test_word[test_index] == with_word[with_index]

tries = 0

def try_grid(grid, letters, words):
    globals()['tries'] += 1
    j = 0
    for line in grid:
        if "word" not in line:
            break
        j += 1
    if "word" in line:
        return grid
    candidates = [w for w in words if len(w) == line['length']]
    constraints = [l for l in line['intersects'] if l[0] < j]
    letters_present = "".join([grid[l[0]]['word'][l[2]] for l in constraints])
    for l in constraints:
        candidates = [w for w in candidates if can_intersect(l[1], l[2], w, grid[l[0]]['word'])]
    for w in candidates:
        new_grid = [g for g in grid]
        new_grid[j] = {
            **new_grid[j],
            'word': w
        }
        new_letters = letters + letters_present
        legal = True
        for l in w:
            if l not in new_letters:
                legal = False
                break
            new_letters = "".join(new_letters.split(l, 1))
        if legal:
            result = try_grid(new_grid, new_letters, words)
            if result is not None:
                return result
    return None

import random

def generate_roll():
    return "".join(
        sorted(
            [random.choice([face for face in die]) for die in
                [
                    "aeiouu",
                    "aaeeoo",
                    "iionny",
                    "nnrrhh",
                    "wrflld",
                    "hhpttw",
                    "ppvfgk",
                    "ggldrr",
                    "ccjtbd",
                    "ccsttm",
                    "szxnbk",
                    "mmblly"
                ]
            ]
        )
    )

def prettify(solution):
    if solution is None:
        return "No solution found!"
    grid = [[" "] * 12 for _ in range(12)]
    for w in solution:
        for i, l in enumerate(w['word'].upper()):
            if w['down']:
                grid[w['start'][0]][w['start'][1] + i] = l
            else:
                grid[w['start'][0] + i][w['start'][1]] = l
    return "\n".join(["".join(l) for l in grid]).rstrip()

successes = []
tries_by_grid = [0 for _ in good]

words_used = { w: 0 for w in realness }

last_letters = None
last_fail = (5, -1)

def solve(letters, start_threshold=5, end_threshold=1, randomize=False, check_first=len(good), do_all=False):
    letters = letters.lower()
    if letters != globals()['last_letters']:
        globals()['last_letters'] = letters
        globals()['last_fail'] = (5, -1)
    real_threshold = min(start_threshold, last_fail[0])
    words = prioritize(letters, real_threshold)
    ordering = [i for i in range(len(good))]
    if randomize:
        random.shuffle(ordering)
    if check_first < len(good):
        ordering = ordering[:check_first]
    for i in ordering:
        grid = good[i]
        if i > last_fail[1]:
            globals()['tries'] = 0
            solution = try_grid(grid, letters, words)
            globals()['tries_by_grid'][i] += globals()['tries']
            if solution is not None:
                globals()['successes'].append(i)
                for w in solution:
                    globals()['words_used'][w['word']] += 1
                if not do_all:
                    return solution
            globals()['last_fail'] = (real_threshold, i)
    for threshold in range(real_threshold - 1, end_threshold - 1, -1):
        print(f"Threshold: {threshold}")
        words = prioritize(letters, threshold)
        for i in ordering:
            grid = good[i]
            globals()['tries'] = 0
            solution = try_grid(grid, letters, words)
            globals()['tries_by_grid'][i] += globals()['tries']
            if solution is not None:
                globals()['successes'].append(i)
                for w in solution:
                    globals()['words_used'][w['word']] += 1
                if not do_all:
                    return solution
            globals()['last_fail'] = (threshold, i)
    return None

words_used = { w: 0 for w in realness }

for i in range(100):
    if (i > 0) and (i % 10 == 0):
        print(i)
    solve(generate_roll(),
          end_threshold=5,
          check_first=25)

def success(i):
    return successes.count(i) / (tries_by_grid[i] + 100)
best = sorted([(i, successes.count(i), tries_by_grid[i]) for i in range(len(good))], key=lambda x: success(x[0]), reverse=True)
best[:30]

with open("approved.json") as f:
    approved = set(json.load(f))

most_used = sorted([(w, words_used[w])
                    for w in words_used
                    if (w not in approved) and (realness[w] == 5)],
                   key=lambda x: x[1],
                   reverse=True)[:10]
most_used

realness['worrits'] = 2
realness['vizor'] = 2
realness['yep'] = 3
realness['yack'] = 4
realness['toby'] = 2
realness['winnock'] = 3
write()

for x in most_used:
    if (realness[x[0]] == 5) and (x[1] > 0):
        approved.add(x[0])

with open("approved.json", "w") as f:
    json.dump(list(approved), f)

roll = generate_roll()
roll

print(prettify(solve("mmooddhckpbh", start_threshold=5)))

good = [good[i[0]] for i in best]
successes = []
tries_by_grid = [0 for _ in good]

with open("grids6.json", "w") as f:
    json.dump(good, f)
