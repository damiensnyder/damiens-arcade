import pandas as pd
import numpy as np

csv_path = "src/lib/test/mayhem-manager/duel-sample.csv"

# Load the CSV file
df = pd.read_csv(csv_path, header="infer")

# TODO: combine all fighters into one set of columns
matrix = np.array(df)
x = matrix[:, 1:]
y = matrix[:, 0]

# do linear regression on the data
solution = np.linalg.lstsq(x, y, rcond=0.02)[0]

print("DUEL STAT".ljust(20) + "INFLUENCE   MEAN")
for i, stat in enumerate(df.columns[1:]):
    temp = float(solution[i])
    print(f"{stat[3:]:<25}{temp:>4.0%}   {np.mean(x[:, i]):.2f}")