import csv
import re

data = open("dataset.txt").read()
fout = open("dataset.csv", "w", newline='\n')
csv_writer = csv.writer(fout, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
lines = data.splitlines()

# Write column names
csv_writer.writerow(['source', 'dest'])

for line in lines:
    pieces = line.split()
    csv_writer.writerow(pieces)

print('\nFinished!\n')
fout.close()