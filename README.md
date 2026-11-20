# ConsentLens

> **Context-Aware Digital Consent, Permission, and Dark-Pattern Copilot**  
> *Hackathon Submission:* PromptWars X Noor AITH – Build for Impact  
> *Chosen Vertical:* **Cybersecurity and Digital Safety** *(with Accessibility and Inclusion Support)*

---

## 1. Chosen Vertical & Problem Context

Every day, individuals and small business owners blindly accept terms of service, permissions manifests, cookie consent banners, and loan agreements. Hidden within these dense legal documents are predatory digital traps:

- **Aggressive Device Permissions:** Contact book harvesting, background SMS reading, and 24/7 fine GPS tracking used for social humiliation and unauthorized collection.
- **Negative-Option Dark Patterns:** Free trial evaluations that silently convert into recurring multi-hundred-dollar non-refundable annual plans with 30-day manual cancellation windows.
- **Legal Rights Stripping:** Irrevocable auto-debit authorizations with compounding daily penalties, broad commercial AI training licenses on private user uploads, and mandatory confidential arbitration with class action waivers.

Existing privacy checkers produce generic, static summaries that fail because they ignore **who the user is** and **what the application actually does**. A flashlight utility requesting background location and contact access is a critical surveillance anomaly; the same request from a ride-hailing app may be routine.

**ConsentLens** solves this by delivering context-aware, persona-adaptive risk analysis, an interactive permission/clause simulator that recalculates threat levels in real time, and one-click copyable opt-out/data-rights letters.

---

## 2. Approach & Solution Logic

ConsentLens uses a dual-engine analysis pipeline engineered for 100% offline reliability and high-speed execution:

```
                          ┌─────────────────────────────┐
                          │   User / Evaluator Input    │
                          │ - Policy or Manifest Text   │
                          │ - Persona (Everyday/A11y/Pro)│
                          │ - App Context (Finance/etc) │
                          │ - Risk Sensitivity (Std/Str)│
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │  Client Cache (Map Lookup)  │
                          └──────────────┬──────────────┘
                                         │ Cache Miss
                                         ▼
                          ┌─────────────────────────────┐
                          │ Sanitization & Injection    │
                          │ Boundary Isolation Engine   │
                          └──────────────┬──────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
       [API Key Present & Online]                 [Zero Key / Offline / Fallback]
                   ▼                                           ▼
  ┌───────────────────────────────────┐       ┌───────────────────────────────────┐
  │         Live LLM Provider         │       │   Deterministic Heuristic Engine  │
  │     (Google Gemini / OpenAI)      │       │     (Pure TypeScript Evaluator)   │
  │ - Strict Untrusted Delimiters     │       │ - Context Anomaly Detection       │
  │ - Structured JSON Schema Return   │       │ - Probabilistic Survival Scoring  │
  │ - Timeout Abort Guard (12s)       │       │ - Persona-Specific Plain Notes    │
  └─────────────────┬─────────────────┘       └─────────────────┬─────────────────┘
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          │
                                          ▼
                          ┌─────────────────────────────┐
                          │  Validated AnalysisResult   │
                          │  - Overall Score (0-100)    │
                          │  - Executive Verdict        │
                          │  - Categorized Findings     │
                          │  - Actionable Countermeasures│
                          │  - Tailored Opt-Out Letter  │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │  Interactive Risk Simulator │
                          │  Live Recalculation on Toggle│
                          └─────────────────────────────┘
```

### 2.1 Dynamic Persona & Context Engine
ConsentLens adapts its evaluation criteria, scoring math, tone, and generated letters based on three dimensions:

1. **User Persona:**
   - **Everyday User:** Focuses on everyday harms: surprise charges, battery/data drain from GPS, invasive contact sharing, and unwanted marketing.
   - **Accessibility & Plain-Language First:** Eliminates legal jargon; uses simple, short sentences, explicit cause-and-effect explanations (*"What happens"* / *"Why it is unsafe"*), and clear step-by-step guidance.
   - **Privacy-Strict Professional:** Focuses on regulatory compliance (GDPR Art. 6/7/17/21, CCPA/CPRA § 1798.120), third-party data brokering, telemetry exfiltration, lack of sub-processor transparency, and class-action waivers.
2. **Usage Context:**
   - **Finance / Instant Loan / Banking:** Scrutinizes contact harvesting (harassment of relatives), SMS scraping (financial OTPs), auto-debit mandates, and penalty fees.
   - **SaaS / Subscription / AI Tool:** Scrutinizes silent annual renewal traps, perpetual AI training licenses on uploaded documents, forced binding arbitration, and hard-to-cancel procedures.
   - **Utility / Flashlight / Simple Tool:** Detects category permission anomalies: contacts, SMS, GPS, or external analytics requested by a local utility are flagged as immediate high-risk anomalies.
   - **Health / Fitness / Wearable:** Flags biometric monetization, medical record brokering, and insurance provider data sharing.
3. **Risk Sensitivity:**
   - **Standard Sensitivity:** Standard risk scoring.
   - **Strict Sensitivity:** Applies a 1.25x penalty multiplier to telemetry, tracking, and dark patterns.

### 2.2 Mathematical Risk Scoring & Simulator Recalculation
Rather than using a naive additive counter that clips at 100 and stops responding to user actions, ConsentLens utilizes a **probabilistic cumulative risk survival model**:

$$P(\text{Safe}) = \prod_{i=1}^{n} (1 - r_i)$$
$$\text{Risk Score} = \text{Round}\left(100 \times (1 - P(\text{Safe}))\right)$$

Where $r_i$ represents the individual risk probability factor of finding $i$, adjusted for context anomalies and persona weights. When an evaluator toggles off an intrusive permission in the **Interactive Risk Simulator**, $P(\text{Safe})$ immediately increases, producing a live, non-saturating point reduction (`scoreDelta < 0`) that demonstrates the immediate digital safety benefit of revoking that permission.

---

## 3. How the Solution Works

1. **Quick-Load Realistic Scenarios:**
   - **Predatory Instant Loan App (High Risk):** Demonstrates detection of contact harvesting, SMS reading, background location, debt collection broker sharing, and auto-debit mandates.
   - **SaaS Productivity & AI Tool (Medium-High Risk):** Demonstrates detection of silent annual auto-renewals, perpetual AI model training on user files, and mandatory arbitration waivers.
   - **Offline Markdown Reader (Safe Baseline):** Demonstrates accurate differentiation—local file storage is scoped and harmless, resulting in a safe score without false alarms.
2. **Custom Policy / Manifest Analysis:**
   - Paste any legal text, mobile app manifest, or cookie notice into the textarea (capped at 45,000 characters).
   - Select your desired Persona, App Context, and Risk Sensitivity.
   - Click **Analyze Consent & Risks**.
3. **Interactive Simulation:**
   - Flip switches in the **Interactive Risk Simulator** to deny specific permissions (e.g., turn off *Full Address Book Access* or *Background SMS*).
   - Watch the risk score and verdict badge recalculate instantly with verified point reductions.
4. **Actionable Countermeasures & Opt-Out Draft:**
   - Review specific OS-level permission steps to take on your device.
   - Copy the customized, persona-formatted data deletion and opt-out request letter with one click.

---

## 4. Architecture, Security & Accessibility

### 4.1 Architecture & Tech Stack
- **Framework:** Next.js (App Router) + React 19 + TypeScript (`strict: true`)
- **Styling:** Standard CSS with semantic custom properties (`src/app/globals.css`)
- **Typography:** Single font family (`Inter`, with clean system sans-serif fallback)
- **Icons:** Custom SVG components (`src/components/Icons.tsx`) with `1.75px` stroke geometry and `aria-hidden="true"`
- **Testing:** Vitest (`vitest run` via `npm test`)
- **Repo Footprint:** Total tracked repository size is **0.19 MB**, strictly below the 10 MB hackathon limit.

### 4.2 Security Measures
- **Server-Side API Key Isolation:** Any optional `GEMINI_API_KEY` or `OPENAI_API_KEY` is accessed exclusively in server-side route handlers (`src/app/api/analyze/route.ts`). Keys are never sent to or bundled into client code.
- **Untrusted Input Delimiters:** User text is framed inside `<policy_text>` delimiters with all delimiter breakout sequences sanitized (`&lt;/policy_text&gt;`) to defend against prompt injection.
- **Privacy Preservation:** User policy text is processed transiently in memory. It is **never logged** to server logs, disk, or remote analytics.
- **Input Sanitization & Length Caps:** Inputs are stripped of null bytes, control characters, and capped at 45,000 characters to prevent buffer and memory exhaustion attacks. No `eval()`, `new Function()`, or `dangerouslySetInnerHTML` is used anywhere.

### 4.3 Accessibility (a11y) & UX Standards
- **Zero-Emoji Policy:** Employs crisp inline SVGs everywhere. No emojis are used in the UI, badges, labels, or buttons to prevent screen-reader noise and inconsistent cross-platform emoji rendering.
- **Color Independence:** Risk levels are always paired with explicit text badges (`HIGH RISK`, `MEDIUM RISK`, `SAFE`) and unique geometric SVG icons (`AlertTriangleIcon`, `AlertCircleIcon`, `CheckCircleIcon`), satisfying WCAG Non-Text Contrast and Color Independence requirements.
- **Keyboard Navigation & Focus:** Full keyboard navigation (`Tab`, `Enter`, `Space`) with high-visibility `:focus-visible` outlines (`2px solid #B45309`, outline offset `2px`).
- **Screen Reader Support:** Semantic HTML tags (`<header>`, `<main>`, `<section>`, `<label>`, `<button>`) with `aria-live="polite"` status announcements and `role="switch"` controls.
- **Restrained Typography:** No oversized display banners (`>24px`), no glassmorphism, and no floating 4-tab bars. Clean, warm, high-contrast palette (`#FAF8F5`, `#FFFFFF`, `#1F1D1A`, `#B45309`).

---

## 5. Assumptions Made

1. **Offline-First Resilience:** In hackathon and judging environments, internet connections may be throttled, offline, or external API quotas may be exhausted. Therefore, the deterministic heuristic engine is self-contained and produces 100% of all features without requiring an API key.
2. **Context Matters More Than Plain Word Matches:** The word "location" is not inherently harmful. ConsentLens evaluates permissions against the declared application category (`utility`, `finance`, `saas`, `health`) to surface genuine behavioral anomalies.
3. **User Actionability:** Analysis is only useful if the user can act upon it. Every finding connects to a concrete harm, an operating-system permission step, and an enforceable legal opt-out draft.

---

## 6. Getting Started & Verification

### Prerequisites
- Node.js (v18, v20, v22, or v26)
- npm

### Installation & Local Run
```bash
# 1. Install lean dependencies
npm install

# 2. Run automated unit tests
npm test

# 3. Build for production (verifies TypeScript strict types)
npm run build

# 4. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Optional: Enabling Live AI
ConsentLens works out of the box with zero configuration. If you wish to enable live Gemini or OpenAI evaluations:
```bash
cp .env.example .env
# Add your key to .env:
# GEMINI_API_KEY=your_key_here
```
When a valid key is provided, the UI displays `Analysis Engine: Live AI`; otherwise, it smoothly falls back to `Analysis Engine: Local Rule Engine`.
