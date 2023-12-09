import json
import csv
import random


with open("analysis/definitions.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    definitions = {}
    for row in reader:
        definitions[row[1].lower()] = row[1]

with open("analysis/realness.json") as f:
    realness = json.load(f)
    for word in realness:
        if realness[word] < 3:
            realness[word] -= 1
        if word not in definitions:
            del(realness[word])
    for word in definitions:
        if word not in realness:
            realness[word] = 5

with open("analysis/ratings.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    rated = {}


with open("analysis/grids.json") as f:
    good = json.load(f)


# last_letters = None
# last_fail = (5, -1)


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


"""
def try_grid(grid, letters, words):
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
"""
    

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


"""
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
            if solution is not None:
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
            if solution is not None:
                if not do_all:
                    return solution
            globals()['last_fail'] = (threshold, i)
    return None
"""


def all_from_grid(grid, letters, words):
    j = 0
    for line in grid:
        if "word" not in line:
            break
        j += 1
    if "word" in line:
        return [grid]
    candidates = [w for w in words if len(w) == line['length']]
    constraints = [l for l in line['intersects'] if l[0] < j]
    letters_present = "".join([grid[l[0]]['word'][l[2]] for l in constraints])
    for l in constraints:
        candidates = [w for w in candidates if can_intersect(l[1], l[2], w, grid[l[0]]['word'])]
    results = []
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
            results += all_from_grid(new_grid, new_letters, words)
    return results

def all_solutions(letters, threshold=1, stop_after=10):
    letters = letters.lower()
    words = prioritize(letters, threshold)
    grids_tried = 0
    solutions = []
    for grid in good:
        grids_tried += 1
        solutions += all_from_grid(grid, letters, words)
        if len(solutions) >= stop_after:
            return solutions, grids_tried
    return solutions, grids_tried

rolls = []
relevant_words = set()

while len(rolls) < 10:
    roll = generate_roll()
    solutions5, grids_tried5 = all_solutions(roll, 5)
    if len(solutions5) > 0:
        solutions1, grids_tried1 = all_solutions(roll, 1)
        for w in get_possible(roll):
            relevant_words.add(w)
        rolls.append((roll, len(solutions1), grids_tried1, len(solutions5), grids_tried5))

rolls = sorted(rolls, key=lambda x: x[4], reverse=True)
print(sorted(relevant_words))