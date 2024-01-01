import json
import csv


l1 = {}

with open("analysis/wordlist1.txt") as f:
    for line in f.readlines():
        if "\t" in line:
            word = line.split("\t")[0].lower()
            if 3 <= len(word) <= 12:
                l1[word] = 5

with open("analysis/ratings.csv") as f:
    reader = csv.reader(f, delimiter=",", quotechar="\"")
    for row in reader:
        l1[row[0]] = int(row[1])

l2 = set()

with open("analysis/wordlist2.txt") as f:
    for line in f.readlines():
        if " " in line:
            word = line.split(" ")[0].lower()
            if 3 <= len(word) <= 12:
                l2.add(word)

l2_only = sorted(list([w for w in l2 if w not in l1]))

l1_only = sorted(list([w for w in l1 if w not in l2]))

print(len(l2))
print(len(l1))
print(len(l2_only))
print(len(l1_only))

print(l2_only[:30])
print(l1_only[:30])

with open("analysis/ratings.csv", "a") as f:
    for w in l2_only + l1_only:
        f.write(w + ",2\n")
