# AllergenSafe — Design Document

---

## 1. Architecture Overview

```
┌─────────────────────┐        HTTPS / REST        ┌──────────────────────────┐
│   iOS App           │ ◄────────────────────────► │   Express API (EC2)      │
│   React Native      │                            │   Node.js + Prisma ORM   │
│   Expo              │                            │   PostgreSQL             │
└─────────────────────┘                            └──────────────────────────┘
                                                              │
                                                   ┌──────────▼───────────┐
                                                   │   OpenAI GPT-4o-mini │
                                                   │   Vision API         │
                                                   └──────────────────────┘
```

The iOS app communicates exclusively with the backend API. The backend handles authentication, data persistence, and all AI inference. No AI calls are made from the client.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| iOS App | React Native (Expo), TypeScript |
| Navigation | @react-navigation/bottom-tabs |
| Camera / Image | expo-image-picker |
| File I/O | expo-file-system (legacy) |
| Local storage | AsyncStorage (JWT token) |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (AWS RDS / EC2) |
| AI | OpenAI GPT-4o-mini (vision) |
| Auth | JWT (30-day expiry), bcryptjs |
| Email | Nodemailer (SMTP) |
| Hosting | AWS EC2 + Nginx + PM2 |
| SSL | Certbot (Let's Encrypt via nip.io) |
| Web frontend | React 19, Vite, Tailwind CSS (Vercel) |

---

## 3. Data Models

### User
| Field | Type | Notes |
|---|---|---|
| id | cuid | Primary key |
| name | String | |
| email | String | Unique, lowercase |
| password | String | bcrypt hash |
| hasOnboarded | Boolean | Onboarding flow completed |
| resetOtp | String? | bcrypt-hashed 6-digit OTP |
| resetOtpExpiry | DateTime? | 15-minute window |
| createdAt | DateTime | |

### Allergen
| Field | Type | Notes |
|---|---|---|
| id | cuid | Auto-generated |
| name | String | e.g. "Peanuts" |
| enabled | Boolean | User toggle |
| severity | String | fatal / intolerance / mild |
| emoji | String | Display emoji |
| userId | String | FK → User |

### Scan
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| userId | String | FK → User |
| productName | String? | Extracted by AI |
| ingredients | String[] | Full ingredient list |
| detectedAllergens | Json | Array of { ingredient, matchedAllergens, explanation } |
| traceAllergens | Json | Array of { allergens, warning } |
| safetyRating | String | safe / warning / danger / unknown |
| nutritionalInfo | Json? | calories, protein, carbs, fat, etc. |
| imageUrl | String? | Photo URI |
| createdAt | DateTime | |

---

## 4. API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/signup | — | Register new user |
| POST | /api/auth/login | — | Login, returns JWT |
| POST | /api/auth/onboard | ✓ | Mark user as onboarded |
| POST | /api/auth/forgot-password | — | Send OTP to email |
| POST | /api/auth/reset-password | — | Verify OTP, set new password |

### Allergens
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/allergens | ✓ | Get user's allergen list |
| PUT | /api/allergens | ✓ | Replace entire allergen list |

### Analysis
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/analyze | ✓ | Analyse base64 image, returns ScanResult |

### History
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/history | ✓ | Get scan history (newest first) |
| POST | /api/history | ✓ | Add scan to history |
| DELETE | /api/history | ✓ | Clear all history |

---

## 5. AI Analysis — Prompt Design

The `/api/analyze` endpoint sends the image and the user's enabled allergen names to GPT-4o-mini with a structured JSON prompt. The model is instructed to:

1. Extract the full ingredient list
2. Identify the product name if visible
3. Flag any ingredient that matches or is a derivative of a user allergen (including scientific/alternative names)
4. Identify cross-contamination warnings ("may contain", "produced in a facility")
5. Set `ingredientsVisible: false` and `safetyRating: "unknown"` if no ingredient list is present in the photo
6. Return structured JSON — never prose

The response is parsed and validated before being stored or returned to the client.

---

## 6. App Screens & Navigation

```
App.tsx (root state manager)
│
├── LoginScreen          — email/password login + signup
│   ├── ForgotPassword   — enter email to receive OTP
│   └── ResetPassword    — enter OTP + new password
│
├── OnboardingScreen     — 4-step first-time setup (new users only)
│   ├── Step 1: Welcome / feature overview
│   ├── Step 2: Profile name
│   ├── Step 3: Allergen configuration
│   └── Step 4: Summary + confirm
│
└── Main Tabs (Bottom Tab Navigator)
    ├── Home             — greeting, hero scan CTA, allergen chips, last scan
    ├── Scan             — camera / library picker  →  ResultScreen
    ├── History          — filterable scan list
    └── Settings         — allergen management, add/remove/toggle, logout
```

---

## 7. State Management

All global state lives in `App.tsx` and is passed down via props. There is no Redux or Context API — the app is small enough that prop drilling is manageable.

| State | Type | Description |
|---|---|---|
| user | { name, email } \| null | Authenticated user |
| appReady | boolean | Session restore complete |
| showOnboarding | boolean | New user flag |
| allergens | Allergen[] | User's allergen profile |
| history | HistoryItem[] | Up to 50 most recent scans |
| currentResult | ScanResult \| null | Result shown in Scan tab |
| currentImageUri | string \| undefined | Photo URI for current result |
| scanTab | 'scan' \| 'result' | Which sub-view the Scan tab shows |

---

## 8. Authentication Flow

```
App launch
    │
    ├── JWT in AsyncStorage?
    │       ├── Yes → load allergens + history from API → show main tabs
    │       └── No  → show LoginScreen
    │
LoginScreen
    ├── Signup → POST /auth/signup → save JWT → check hasOnboarded
    └── Login  → POST /auth/login  → save JWT → check hasOnboarded
                                          │
                              hasOnboarded = false?
                                  └── show OnboardingScreen
                                          └── POST /auth/onboard → main tabs
```

---

## 9. Password Reset Flow

```
LoginScreen → "Forgot password?"
    └── ForgotPassword screen
            └── POST /auth/forgot-password (email)
                    └── Server: generate OTP → hash → store with 15min expiry → send email
                            └── ResetPassword screen
                                    └── POST /auth/reset-password (email + OTP + newPassword)
                                            └── Server: verify OTP → update password → clear OTP
                                                    └── Back to Login with success message
```

---

## 10. Scan Flow

```
ScanScreen
    ├── takePhoto()  → ImagePicker.launchCameraAsync()
    └── pickImage()  → ImagePicker.launchImageLibraryAsync()
            │
            └── analyzeImage(uri)
                    └── FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
                            └── POST /api/analyze { base64Image, userAllergens }
                                    └── GPT-4o-mini vision → ScanResult JSON
                                            └── onResult(result, imageUri)
                                                    └── save to history → show ResultScreen
```

---

## 11. Safety Rating Logic

Safety rating is computed on the **client** at display time, not stored as-is, so it always reflects the user's current enabled allergens:

```
ingredientsVisible === false         → 'unknown'
detectedAllergens ∩ enabledAllergens → 'danger'
traceAllergens    ∩ enabledAllergens → 'warning'
otherwise                            → 'safe'
```

This means a historical scan result will re-evaluate if the user later enables a new allergen.

---

## 12. Key Design Decisions

**No AI on device** — All inference goes through the backend. This keeps the app lightweight, allows model updates without app releases, and protects the API key.

**OTP via email, not SMS** — Avoids Twilio costs and phone number requirements. 15-minute expiry and bcrypt hashing provide adequate security for a password reset flow.

**Legacy FileSystem import** — `expo-file-system/legacy` is used because `readAsStringAsync` was removed from the main module in Expo SDK 51+. This is a known Expo Go compatibility issue.

**Safety rating computed client-side** — Allows the user's allergen changes to retroactively apply to history items without re-running AI analysis.

**`safetyRating: 'unknown'`** — Prevents false "All Clear" results when a user photographs the front of a product instead of the ingredient list.
