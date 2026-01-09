import json
import datetime
import csv
import random


FIRST_DAY = datetime.date(2026, 1, 8) # + datetime.timedelta(7 * 24)


definitions = {}
realness = {}

with open("analysis/candidates.json") as f:
    candidates = json.load(f)

with open("analysis/ratings.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    for row in reader:
        realness[row[0]] = int(row[1])

with open("analysis/wordlist1.txt") as f:
    for line in f.readlines():
        if "\t" in line:
            [word, definition] = line.split("\t", 1)
            word = word.lower()
            definition = definition.strip()
            if 3 <= len(word) <= 12:
                if word not in realness:
                    realness[word] = 5

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


def is_possible(word, letters):
    if len(word) < 3:
        return False
    for letter in "abcdefghijklmnopqrstuvwxyz":
        if word.count(letter) > letters.count(letter):
            return False
    return True


def get_possible(letters, threshold=3):
    return [
        word for word in realness
        if (realness[word] >= threshold) and is_possible(word, letters)
    ]


current_date = FIRST_DAY
rolls_json = {}

while True:
    day_of_week = current_date.strftime('%A').lower()
    if len(candidates[day_of_week]) == 0:
        break
    roll = candidates[day_of_week].pop(0)
    legal_words = get_possible(roll)
    rolls_json[current_date.strftime("%Y%m%d")] = {
        "roll": roll,
        "legalWords": legal_words
    }
    current_date += datetime.timedelta(1)

with open("analysis/rolls.json", "w") as f:
    json.dump(rolls_json, f)
