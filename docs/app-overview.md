# AllergenSafe — App Overview

## What It Is

AllergenSafe is an AI-powered food allergen detection app for iPhone. Users photograph any food product's ingredient label and receive an instant, personalised safety result — telling them whether the product contains or may contain their specific allergens.

---

## The Problem It Solves

Reading food labels is slow, error-prone, and stressful — especially for people managing multiple allergies or intolerances. Scientific ingredient names (e.g. "casein" for dairy, "albumin" for egg) are easy to miss. AllergenSafe removes that risk by doing the reading for you.

---

## Who It's For

- People with food allergies or intolerances (peanuts, dairy, gluten, shellfish, etc.)
- Parents managing a child's dietary restrictions
- Anyone shopping for someone with specific food requirements

---

## Core Functionality

**Scan a Label**
Point the camera at any ingredient list — or upload a photo from the library. The AI reads the label, identifies all ingredients, and cross-references them against the user's personal allergen profile. Results appear in seconds.

**Personalised Allergen Profile**
Users configure which allergens they need to avoid and how serious each one is (Fatal / Intolerance / Mild). The app comes pre-loaded with all 14 major EU allergens. Custom allergens can be added at any time from Settings.

**Safety Rating**
Every scan produces one of four verdicts:
- ✅ All Clear — no configured allergens detected
- ⚠️ Possible Traces — cross-contamination warnings present
- 🚨 Allergens Detected — one or more configured allergens found
- 🔍 Ingredients Not Found — label not visible in photo

**Ingredient Highlighting**
When allergens are found, the full ingredient list is shown with the triggering ingredients highlighted in yellow so users can see exactly what was flagged and why.

**Scan History**
Every scan is saved with its result, timestamp, product name, and thumbnail. Users can filter history by rating (Safe / Caution / Danger) and tap any past scan to review the full result.

**Account & Sync**
Users create an account with email and password. Their allergen profile and scan history sync to the cloud so data is preserved if they reinstall the app or switch devices.

---

## Supported Allergens (defaults)

Peanuts · Dairy · Gluten · Eggs · Soy · Tree Nuts · Shellfish · Fish · Sesame · Mustard · Celery · Lupin · Sulphites · Molluscs

---

## Platforms

iOS (iPhone) via Expo / React Native. Backend hosted on AWS EC2. Web companion app available via browser.
