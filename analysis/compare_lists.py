import json
import csv


definitions = {}
realness = {}

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

print(realness["born"])
print(definitions["born"])
print(realness["clonk"])
print(definitions["clonk"])
print(realness["methodical"])
print(definitions["methodical"])