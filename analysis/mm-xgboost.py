import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.linear_model import LinearRegression

csv_path = "src/lib/test/mayhem-manager/duel-sample-large.csv"

df = pd.read_csv(csv_path, header="infer")
num_columns_per_fighter = int((len(df.columns) - 1) / 12)
colnames = [n[6:] for n in df.columns[1:num_columns_per_fighter + 1]]
num_matches = len(df)

matrix = np.array(df)
wide_x = matrix[:, 1:]
x = np.zeros(shape=(num_matches * 12, num_columns_per_fighter))
for i in range(12):
    x[i * num_matches:(i + 1) * num_matches, :] = wide_x[:, i * num_columns_per_fighter:(i + 1) * num_columns_per_fighter]
y = matrix[:, 0]
y = np.resize(y, len(y) * 12)
y[int(len(y) / 2):] = -y[int(len(y) / 2):]

lm = LinearRegression()
lm.fit(x, y)

with open("analysis/mm-coeffs.txt", "w") as f:
    f.write(f"intercept: {lm.intercept_:.0%}\n")
    for i, n in enumerate(colnames):
        f.write(f"{n}: {lm.coef_[i]:.0%}\n")

residuals = y - lm.predict(x)
dtrain = xgb.DMatrix(x, label=residuals)
params = {
    "objective": "reg:squarederror",
    "device": "gpu",
    "max_depth": 3,
    "eta": 0.1
}
xgb_model = xgb.train(params, dtrain)
xgb_model.dump_model("analysis/mm-xgb.txt")