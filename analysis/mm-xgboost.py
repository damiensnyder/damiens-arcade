import xgboost as xgb
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

# Convert the data to the format required by XGBoost
dtrain = xgb.DMatrix(x, label=y)

# Define the parameters for XGBoost
params = {
    "objective": "reg:squarederror",
    "device": "gpu",
    "max_depth": 3,
    "eta": 0.1
}

# Train the XGBoost model
model = xgb.train(params, dtrain)

# Make predictions using the trained model
predictions = model.predict(dtrain)

print(np.square(predictions - y).mean())

model.dump_model("analysis/model.txt")