import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LassoCV
from sklearn.pipeline import make_pipeline

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

# create polynomial features
poly = PolynomialFeatures(degree=2, interaction_only=False, include_bias=True)
X_poly = poly.fit_transform(x)

# Perform Lasso regression with cross-validation
lasso = LassoCV(cv=5, random_state=0)
model = make_pipeline(poly, lasso)
model.fit(x, y)

# Get feature names
feature_names = poly.get_feature_names_out(df.columns[1:num_columns_per_fighter + 1])

# Get non-zero coefficients
non_zero = model.named_steps['lassocv'].coef_ != 0
selected_features = feature_names[non_zero]
selected_coefs = model.named_steps['lassocv'].coef_[non_zero]

# Sort features by importance
feature_importance = sorted(zip(selected_features, selected_coefs), 
                            key=lambda x: abs(x[1]), reverse=True)

# Select top N features (adjust N as needed)
N = 400  # or any number between 40 and 400
top_features = feature_importance[:N]

from sklearn.linear_model import LinearRegression

# Create a new dataset with only selected features
X_selected = X_poly[:, non_zero][:, :N]

# Fit a linear regression model
final_model = LinearRegression()
final_model.fit(X_selected, y)

# These are your final coefficients
final_coefs = final_model.coef_

import json

feature_coef_dict = {str(feature): coef for feature, coef in zip(top_features, final_coefs)}

with open("analysis/mm-coeffs.json", "w") as f:
    json.dump(feature_coef_dict, f)