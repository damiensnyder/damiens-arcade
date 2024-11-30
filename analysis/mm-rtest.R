library(tidyverse)
library(xgboost)

csv_path <- "../src/lib/test/mayhem-manager/duel-sample-large.csv"
resid_path <- "residuals.csv"

df <- read.csv(csv_path)
num_columns_per_fighter <- floor((ncol(df) - 1) / 12)
feature_names <- substring(colnames(df)[1:num_columns_per_fighter + 1], 7)
num_matches = nrow(df)
wide_x <- df[abs(df$result) <= 2, 2:ncol(df)]
colnames(wide_x) <- rep(feature_names, 12)
y <- df$result[abs(df$result) <= 2]
y <- 2 * sign(y) * (y - sign(y)) ** 2

# considering all fighters individually
x_indiv <- wide_x[, 1:num_columns_per_fighter]
for (i in 1:11) {
  x_indiv <- rbind(x_indiv, wide_x[, (i * num_columns_per_fighter + 1):((i + 1) * num_columns_per_fighter)])
}
y_indiv <- c(rep(y, 6), rep(-y, 6))
y_indiv[(length(y_indiv) / 2 + 1):length(y_indiv)] <- -y_indiv[(length(y_indiv) / 2 + 1):length(y_indiv)]
lm_indiv <- lm(y_indiv ~ ., data = x_indiv)

# # if adding all fighters and subtracting opponents
# x_added <- wide_x[, 1:num_columns_per_fighter]
# for (i in 1:5) {
#   x_added <- x_added + wide_x[, (i * num_columns_per_fighter + 1):((i + 1) * num_columns_per_fighter)]
# }
# for (i in 6:11) {
#   x_added <- x_added - wide_x[, (i * num_columns_per_fighter + 1):((i + 1) * num_columns_per_fighter)]
# }
# lm_added <- lm(y ~ ., data = x_added)
# 
# plot(y, lm_added$fitted.values)
# 
# # write residuals to csv
# resid_indiv <- c(rep(lm_added$residuals, 6), rep(-lm_added$residuals, 6))
# resid_info <- cbind(
#   data.frame(residuals = resid_indiv),
#   x_indiv
# )
# write.csv(resid_info, resid_path)
# 
# # do xgboost on the residuals
# xgb_indiv <- xgboost(
#   data = data.matrix(x_indiv),
#   label = resid_indiv,
#   params = list(
#     max_depth = 3
#   ),
#   nrounds = 10
# )
# xgb.dump(xgb_indiv, "resid_model.txt")
# xgb_normal <- xgboost(
#   data = data.matrix(x_indiv),
#   label = y_indiv,
#   nrounds = 30
# )
# xgb.dump(xgb_normal, "indiv_model.txt")

# lm_strength <- lm(resid_indiv ~ ., data = x_indiv * x_indiv[, 1])
lm_interaction <- lm(y_indiv ~ .^2, data = x_indiv)
lm_interaction_summary <- summary(lm_interaction)
random_10000 <- sample(1:length(y_indiv), 10000)
plot(y_indiv[random_10000], lm_interaction$fitted.values[random_10000])
coeffs_interaction <- lm_interaction_summary$coefficients
# significant <- coeffs_interaction[, 4] < 0.1
# significant[1:30] <- TRUE
# coeffs_signif <- coeffs_interaction[significant, 1]
write.csv(coeffs_interaction[, 1], "mm_coeffs.csv")
