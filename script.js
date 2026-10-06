/* Mental Health Score Predictor - frontend logic (vanilla JS) */
"use strict";

   const API_URL = "https://mental-health-prediction-score-5.onrender.com/predict";

const form = document.getElementById("assessmentForm");
const predictBtn = document.getElementById("predictBtn");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("errorBox");
const errorTitle = document.getElementById("errorTitle");
const errorDetail = document.getElementById("errorDetail");
const resultCard = document.getElementById("result");

// Validation rules. Keys match the FastAPI StudentData model exactly.
const numericRules = {
  age:                     { label: "Age",                  min: 10, max: 100, integer: true },
  avg_daily_usage_hours:   { label: "Daily usage hours",    min: 0,  max: 24 },
  daily_unlocks:           { label: "Daily unlocks",        min: 0,  integer: true },
  study_hours:             { label: "Study hours",          min: 0,  max: 24 },
  physical_activity_hours: { label: "Physical activity",    min: 0,  max: 24 },
  sleep_hours_per_night:   { label: "Sleep hours",          min: 0,  max: 24 }
};
const textFields = ["gender", "country", "academic_level", "most_used_platform", "purpose_of_use", "stress_level"];

/* ---------- Helpers ---------- */

function setError(name, message) {
  const input = document.getElementById(name);
  document.querySelector(`.error[data-for="${name}"]`).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

function clearErrors() {
  [...textFields, ...Object.keys(numericRules)].forEach((n) => setError(n, ""));
  errorBox.hidden = true;
}

function showError(title, detail) {
  errorTitle.textContent = title;
  errorDetail.textContent = detail;
  errorBox.hidden = false;
}

/* Validate all fields; returns the payload object or null if invalid. */
function validate() {
  clearErrors();
  let valid = true;
  let firstInvalid = null;
  const fail = (name, msg) => { setError(name, msg); valid = false; firstInvalid = firstInvalid || name; };

  textFields.forEach((name) => {
    if (!document.getElementById(name).value.trim()) {
      fail(name, name === "country" ? "Please enter your country." : "Please choose an option.");
    }
  });

  const data = {};
  for (const [name, rule] of Object.entries(numericRules)) {
    const raw = document.getElementById(name).value.trim();
    const num = Number(raw);
    if (raw === "" || Number.isNaN(num)) { fail(name, `${rule.label} is required.`); continue; }
    if (rule.integer && !Number.isInteger(num)) { fail(name, `${rule.label} must be a whole number.`); continue; }
    if (rule.max !== undefined && (num < rule.min || num > rule.max)) {
      fail(name, `${rule.label} must be between ${rule.min} and ${rule.max}.`); continue;
    }
    if (num < rule.min) { fail(name, `${rule.label} cannot be negative.`); continue; }
    data[name] = num;
  }

  if (!valid) { document.getElementById(firstInvalid).focus(); return null; }

  textFields.forEach((name) => { data[name] = document.getElementById(name).value.trim(); });
  return data;
}

/* Turn a FastAPI error response into a friendly message. */
function friendlyApiError(status, body) {
  if (status === 422 && body && Array.isArray(body.detail)) {
    const items = body.detail.map((d) => {
      const field = (d.loc && d.loc[d.loc.length - 1]) || "a field";
      return `${String(field).replace(/_/g, " ")}: ${d.msg}`;
    });
    return "Some values were not accepted by the server. " + items.join("; ") + ".";
  }
  if (body && typeof body.detail === "string") return body.detail;
  return `The server responded with an error (HTTP ${status}). Please try again.`;
}

function setLoading(isLoading) {
  predictBtn.disabled = isLoading;
  predictBtn.textContent = isLoading ? "Analyzing..." : "Predict Mental Health Score";
  loading.hidden = !isLoading;
}

/* ---------- Submit ---------- */

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (predictBtn.disabled) return; // prevent multiple submissions

  const data = validate();
  if (!data) return;

  resultCard.hidden = true;
  setLoading(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    let body = null;
    try { body = await response.json(); } catch (_) { /* non-JSON body */ }

    if (!response.ok) {
      showError("The prediction could not be completed.", friendlyApiError(response.status, body));
      return;
    }
    showResult(body.predicted_mental_health_score);
  } catch (err) {
    showError(
      "Unable to connect to the prediction server.",
      "Please make sure the FastAPI server is running at http://127.0.0.1:8000."
    );
  } finally {
    setLoading(false);
  }
});

/* ---------- Result ---------- */

function showResult(score) {
  // The score is displayed exactly as returned by the API.
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("scoreText").textContent =
    ` model generated a score of ${score} based on the information provided.`;

  // Ring fill only clamps to the 0-100 visual range; the displayed number is unchanged.
  const pct = Math.min(100, Math.max(0, Number(score)));
  document.getElementById("ring").style.setProperty("--pct", pct);

  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- Buttons ---------- */

document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("assessment").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("againBtn").addEventListener("click", () => {
  form.reset();
  clearErrors();
  resultCard.hidden = true;
  document.getElementById("assessment").scrollIntoView({ behavior: "smooth" });
  document.getElementById("age").focus({ preventScroll: true });
});

document.getElementById("printBtn").addEventListener("click", () => window.print());

/* Clear a field's error as soon as the user edits it. */
form.addEventListener("input", (e) => { if (e.target.id) setError(e.target.id, ""); });
