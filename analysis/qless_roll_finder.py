import json
import csv
import random

# Settings
ANY_LETTERS = False  # if false, restrict rolls to only those that could appear
                    # from real Q-less dice
NUM_ROLLS = 40  # number of rolls to generate

definitions = {}
realness = {}

# Load flat files
with open("analysis/ratings.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    for row in reader:
        realness[row[0]] = int(row[1])

with open("analysis/wordlist2.txt") as f:
    for line in f.readlines():
        if " " in line:
            [word, definition] = line.split(" ", 1)
            word = word.lower()
            definition = definition.strip()
            definitions[word] = definition
            if 3 <= len(word) <= 12:
                if word not in realness:
                    realness[word] = 5

with open("analysis/wordlist1.txt") as f:
    for line in f.readlines():
        if "\t" in line:
            [word, definition] = line.split("\t", 1)
            word = word.lower()
            definition = definition.strip()
            if 3 <= len(word) <= 12:
                if word not in realness:
                    realness[word] = 5

with open("analysis/grids.json") as f:
    good = json.load(f)

with open("analysis/rolls.txt") as f:
    current_rolls = [r.strip() for r in f.readlines() if len(r.strip()) == 12]

with open("analysis/stored_solutions.json") as f:
    stored_solutions = json.load(f)


def is_possible(word, letters):
    """Determine if `word` can be made using the set of letters in `letters`."""
    if len(word) < 3:
        return False
    for letter in "abcdefghijklmnopqrstuvwxyz":
        if word.count(letter) > letters.count(letter):
            return False
    return True


def get_possible(letters, threshold=5):
    """
    Get all possible words that can be formed using the set of letters in `letters`,
    as long as their "realness" is above `threshold`. (Realness is my estimate of
    how well-known / legit a word is, to ensure no obscure or dubious words are
    needed to solve the Q-less roll.)
    """
    return [
        word for word in realness
        if (realness[word] >= threshold) and is_possible(word, letters)
    ]


def prioritize(letters, threshold=5):
    """
    Get all possible words that can be formed using the set of letters in `letters`,
    as long as their "realness" is above `threshold`. Results should be ordered so
    words with less common letters are earlier in the list.
    """
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
    """
    Return true if `test_word` can intersect `with_word`, if they meet at
    index `test_index` in `test_word` and `with_index` in `with_word`.
    """
    return test_word[test_index] == with_word[with_index]
  

def generate_roll():
    """
    Generate a set of 12 letters, either using the real Q-less dice faces or
    the whole alphabet (depending on the value of `ALL_LETTERS`).
    """
    if ANY_LETTERS:
        return "".join(
            sorted(
                [random.choice([face for face in die]) for die in
                    ["abcdefghijklmnopqrstuvwxyz"] * 12
                ]
            )
        )
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
    """
    Format a solution visually as a grid, where each line in the returned
    string is a row.
    """
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


def all_from_grid(grid, letters, words):
    """
    Get all valid solutions from `grid`, given the set of letters in the roll
    (`letters`) and all legal words that can be formed from them (`words`).
    """
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


def all_solutions(letters, threshold=5, stop_after=10):
    """
    Get all solutions to the roll given by `letters`, allowing only words with
    realness >= `threshold`, and stopping after `stop_after` solutions are
    found.
    """
    letters = letters.lower()
    words = prioritize(letters, threshold)
    grids_tried = 0
    solutions = []
    # Check all solutions stored in stored_solutions.json, to see if they are
    # all still legal for this grid. (If this grid has been solved before.)
    if letters in stored_solutions:
        grids_tried = stored_solutions[letters]['max_grid_tried']
        for solution in stored_solutions[letters]['solutions']:
            if all([line['word'] in words for line in solution]):
                solutions.append(solution)
            for line in solution:
                words_used.add(line['word'])
    for grid in good[grids_tried:]:
        if len(solutions) >= stop_after:
            return solutions, grids_tried
        solutions += all_from_grid(grid, letters, words)
        grids_tried += 1
    return solutions, grids_tried

rolls = []
words_used = set()

# Generate rolls and find their solutions until enough have been found.
while len(rolls) < NUM_ROLLS:
    if len(current_rolls) > 0:
        roll = current_rolls.pop()
    else:
        roll = generate_roll()
    solutions5, grids_tried5 = all_solutions(roll, 5)
    for s in solutions5[:25]:
        for line in s:
            words_used.add(line['word'])
    if len(solutions5) > 0:
        rolls.append((roll, len(solutions5), grids_tried5))
        stored_solutions[roll] = {
            'solutions': solutions5,
            'max_grid_tried': grids_tried5
        }
    elif roll in stored_solutions:
        del stored_solutions[roll]

rolls = sorted(rolls, key=lambda x: x[2], reverse=True)
print(rolls)

with open("analysis/rolls.txt", "w") as f:
    f.writelines([r[0] + "\n" for r in rolls])

# Write to file any words without a "realness" score, with definitions, so I
# can assign their realness score.
with open("analysis/new_words.csv", "w") as f:
    for word in sorted(words_used, key=lambda x: len(x)):
        if realness[word] == 5:
            f.write(f"{word},,\"{definitions[word]}\"\n")

# Write all found solutions to file to save work if the same rolls are done
# after assigning new realness scores.
with open("analysis/stored_solutions.json", "w") as f:
    json.dump(stored_solutions, f)