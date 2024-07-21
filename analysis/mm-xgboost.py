import csv
import xgboost as xgb
import numpy as np

csv_path = "src/lib/test/mayhem-manager/duel-sample.csv"

# Load the CSV file
data = []
with open(csv_path, "r") as file:
    reader = csv.reader(file)
    for row in reader:
        if "result" not in row:
            data.append([float(x) for x in row])

# Separate the features (columns 1-48) and the target (column 0)
data = np.array(data)
x = data[:, 1:]
y = data[:, 0]

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