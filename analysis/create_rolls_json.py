import json
import datetime
import csv
import random


FIRST_DAY = datetime.date(2023, 12, 15)


with open("analysis/candidates.json") as f:
    candidates = json.load(f)

with open("analysis/ratings.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    realness = {}
    for row in reader:
        realness[row[0]] = int(row[1])

with open("analysis/definitions.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    definitions = {}
    for row in reader:
        if (len(row[0]) > 2) and (row[0].lower() not in realness):
            realness[row[0].lower()] = 5


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
