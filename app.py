from flask import Flask, render_template, request
import os
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load("model/house_price_model.pkl")
columns = joblib.load("model/columns.pkl")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():

    sqft = float(request.form["sqft"])
    bath = float(request.form["bath"])
    balcony = float(request.form["balcony"])
    bhk = int(request.form["bhk"])
    location = request.form["location"]

    x = np.zeros(len(columns))

    x[0] = sqft
    x[1] = bath
    x[2] = balcony
    x[3] = bhk

    if location in columns:
        loc_index = columns.index(location)
        x[loc_index] = 1

    prediction = model.predict([x])[0]

    return render_template(
        "index.html",
        prediction_text=f"Estimated Price: ₹ {prediction:.2f} Lakhs"
    )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )