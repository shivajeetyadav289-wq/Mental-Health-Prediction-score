# 🧠 Mental Health Score Predictor

A machine-learning web app that predicts a student's **Mental Health Score** from their social media habits, lifestyle, and stress level. The model is a scikit-learn Random Forest pipeline, served through a **FastAPI** backend and used from a clean **HTML/CSS/JavaScript** frontend.

> ⚠️ **Disclaimer:** This is an educational project. It is **not** a medical or diagnostic tool and must not replace advice from a qualified mental health professional.

---

## ✨ Features

- Predicts a numeric mental health score from 12 input features
- End-to-end ML workflow: EDA → cleaning → feature engineering → modelling → deployment
- Preprocessing and model packaged in a single `Pipeline`, so training and serving stay consistent
- REST API with strict input validation (Pydantic)
- Responsive frontend with client-side validation, loading state, and friendly error messages

---

## 📊 Dataset

**File:** `Student Social Media And Mental Health Impact.csv`

- 5,000 student records, 13 columns, no missing values
- Target: `Mental_Health_Score` (range 3.6 – 9.4, mean ≈ 6.23)

| Feature | Type | Description |
|---|---|---|
| `Age` | Numeric | Student age (18–24) |
| `Gender` | Categorical | Male / Female |
| `Country` | Categorical | 111 countries (grouped to top 10 + Other) |
| `Academic_Level` | Categorical | High School / Undergraduate / Graduate |
| `Most_Used_Platform` | Categorical | Instagram, TikTok, Facebook, etc. (12 platforms) |
| `Purpose_Of_Use` | Categorical | Networking / Education / Entertainment / News |
| `Avg_Daily_Usage_Hours` | Numeric | Daily social media hours |
| `Daily_Unlocks` | Numeric | Phone unlocks per day |
| `Study_Hours` | Numeric | Daily study hours |
| `Physical_Activity_Hours` | Numeric | Daily physical activity hours |
| `Sleep_Hours_Per_Night` | Numeric | Nightly sleep hours |
| `Stress_Level` | Ordinal | Low < Medium < High < Very High |
| `Mental_Health_Score` | **Target** | Continuous score |

---

## 🔬 Methodology

1. **EDA** – target distribution, correlation heatmap, stress-level boxplot, scatter plots (usage, sleep, study hours), platform counts
2. **Cleaning** – removed 2 duplicate rows; clipped negative `Physical_Activity_Hours` values to 0
3. **Feature engineering** – grouped `Country` into the top 10 countries + `Other` (`Grouped_country`)
4. **Preprocessing (`ColumnTransformer`)**
   - `Study_Hours` → `log1p` + `StandardScaler` (right-skewed)
   - Other numeric features → `StandardScaler`
   - `Stress_Level` → `OrdinalEncoder` (Low → Very High)
   - Gender, academic level, platform, purpose, grouped country → `OneHotEncoder`
5. **Modelling** – Linear Regression (baseline), Random Forest, and Random Forest tuned with `RandomizedSearchCV` (15 iterations, 5-fold CV)
6. **Split** – 70% train / 30% test, `random_state=42`

### Results (test set)

| Model | RMSE | MAE | R² (test) | R² (train) |
|---|---|---|---|---|
| Linear Regression | 0.676 | 0.536 | 0.740 | 0.724 |
| Random Forest (default) | 0.463 | 0.346 | **0.878** | 0.981 |
| Random Forest (tuned) | 0.472 | 0.357 | 0.873 | 0.969 |

The exported model (`Mental_Health_Model.pkl`) is the default Random Forest pipeline.

---

## 🗂️ Project Structure

```
Mental-Health-Prediction-score/
├── main.py                                         # FastAPI backend
├── Mental_Health_Model.pkl                         # Trained pipeline (joblib)
├── mental_health_prediction.ipynb                  # EDA, training, evaluation
├── Student Social Media And Mental Health Impact.csv
├── index.html                                      # Frontend page
├── style.css                                       # Frontend styling
├── script.js                                       # Validation + API calls
└── requirements.txt
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/shivajeetyadav289-wq/Mental-Health-Prediction-score.git
cd Mental-Health-Prediction-score
```

### 2. Install dependencies

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

> Use the same `scikit-learn` version the model was trained with, otherwise loading the `.pkl` may fail or warn.

### 3. Run the API

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Interactive docs are at `http://127.0.0.1:8000/docs`.

### 4. Open the frontend

Open `index.html` in your browser (or serve it with `python -m http.server 5500`).

In `script.js`, set `API_URL` to your backend's **predict endpoint**:

```js
const API_URL = "http://127.0.0.1:8000/predict";
```

---

## 🔌 API Reference

### `POST /predict`

**Request body**

```json
{
  "age": 21,
  "gender": "Male",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 4.5,
  "daily_unlocks": 150,
  "study_hours": 3.0,
  "physical_activity_hours": 1.5,
  "sleep_hours_per_night": 7.0,
  "stress_level": "Medium"
}
```

**Response**

```json
{ "predicted_mental_health_score": 6.87 }
```

**Validation rules:** `age` 10–100; all hour fields 0–24; `daily_unlocks` ≥ 0; categorical fields must match the allowed values (see `main.py`). Invalid input returns HTTP `422`.

**cURL example**

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"age":21,"gender":"Male","country":"India","academic_level":"Undergraduate","most_used_platform":"Instagram","purpose_of_use":"Entertainment","avg_daily_usage_hours":4.5,"daily_unlocks":150,"study_hours":3.0,"physical_activity_hours":1.5,"sleep_hours_per_night":7.0,"stress_level":"Medium"}'
```

---

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| Data & ML | Python, pandas, NumPy, scikit-learn, matplotlib, seaborn |
| Backend | FastAPI, Uvicorn, Pydantic, joblib |
| Frontend | HTML5, CSS3, vanilla JavaScript |

---

## ⚠️ Known Limitations & Future Work

- The Random Forest fits training data much more closely than test data (R² 0.98 vs 0.88), which indicates some overfitting. Stronger regularisation or cross-validated model selection could help.
- The dataset is limited to ages 18–24 and is a single snapshot; predictions outside this range are unreliable.
- Possible improvements: try Gradient Boosting / XGBoost, add feature-importance and SHAP explanations, add automated tests, and containerise with Docker.

---

## 👤 Author

**GitHub:** [@shivajeetyadav289-wq](https://github.com/shivajeetyadav289-wq)

If you found this project useful, consider giving it a ⭐!
