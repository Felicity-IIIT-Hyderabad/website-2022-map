import csv
import json

with open("events.tsv") as fd:
    events = {}
    rd = csv.reader(fd, delimiter="\t", quotechar='"')
    for row in rd:
        var, title, desc = row
        events[var] = {"title": title, "description": desc}

    with open("events.json", "w") as outfile:
        json.dump(events, outfile, ensure_ascii=False)
