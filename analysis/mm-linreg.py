import pandas as pd
import numpy as np

csv_path = "src/lib/test/mayhem-manager/duel-sample.csv"

df = pd.read_csv(csv_path, header="infer")
num_columns_per_fighter = int((len(df.columns) - 1) / 12)
num_matches = len(df)

matrix = np.array(df)
wide_x = matrix[:, 1:]
x = np.zeros(shape=(num_matches * 12, num_columns_per_fighter))
for i in range(12):
    x[i * num_matches:(i + 1) * num_matches, :] = wide_x[:, i * num_columns_per_fighter:(i + 1) * num_columns_per_fighter]
y = matrix[:, 0]
y = np.resize(y, len(y) * 12)
y[int(len(y) / 2):] = -y[int(len(y) / 2):]

# do linear regression on the data
solution = np.linalg.lstsq(x, y, rcond=0.02)[0]

print("DUEL STAT".ljust(20) + "INFLUENCE   MEAN")
for i, stat in enumerate(df.columns[1:num_columns_per_fighter + 1]):
    temp = float(solution[i])
    print(f"{stat[6:]:<25}{temp:>4.0%}   {np.mean(x[:, i]):.2f}")