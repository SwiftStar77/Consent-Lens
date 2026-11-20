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

## 2. Progressive 2-Stage User Experience

To eliminate information overload and provide a calm, tactile consumer interface, ConsentLens uses a focused **2-Stage Experience**:

### Stage 1: Clean, Focused Input Canvas (Landing State)
* **Spacious Centered Card:** A focused card (`max-width: 680px`) on a warm canvas (`#F7F3EC`) with clean visual breathing room.
* **Unified Input Mode Switcher:**
  1. **Paste Policy or Permissions:** Textarea with live character counter for terms, cookie notices, and app manifests.
  2. **Check Website or App Link:** Web URL input (`https://example.com/privacy`) with SSRF protection (blocks private IP ranges, loopback, and local domain patterns) and graceful fallback.
* **Tactile Context Pill Selectors:** Horizontal pill selectors for **"Who are you?"** (`Everyday User`, `Plain-Language Mode`, `Privacy-Strict`) and **"What is this for?"** (`Simple Utility`, `Finance / Loan`, `SaaS / AI Tool`, `Health / Fitness`).
* **Quick-Start Sample Chips:** One-click sample pills (`Try: Instant-Loan App`, `Try: SaaS Free Trial`, `Try: Safe Offline Tool`) to populate and configure realistic scenarios instantly.
* **Primary CTA:** A prominent, warm terracotta button (`Analyze Risks Now`) with SVG arrow icon and animated scan state.

### Stage 2: Clear, Scannable Results Screen (After Analysis)
* **"Analyze Another" Back Navigation:** Seamless one-click return to Stage 1.
* **Hero Risk Summary Card:**
  * **SVG Radial Risk Gauge:** High-contrast circular score gauge with dynamic color indicators and severity pills.
  * **Human Advisor Takeaway:** 2-sentence plain-English takeaway with 2–3 quick bullet highlights of what matters.
* **Interactive Risk Simulator:** Real-time permission/clause toggle switches with live non-linear score recalculation (`scoreDelta < 0`).
* **Progressive Disclosure Breakdown:** Scannable cards with Category SVG icon, plain-English impact, and severity pill. Exact agreement text and accessibility notes are collapsed behind clean `"Show details"` accordions.
* **One-Click Action Card:** Immediate protective steps checklist and copyable formal or plain-English opt-out letter with instant copy confirmation.

---

## 3. Architecture & Technical Implementation

```
                          ┌─────────────────────────────┐
                          │   Stage 1: Input Screen     │
                          │ - Paste Text or Safe URL    │
                          │ - Persona (Everyday/A11y/Pro)│
                          │ - Context (Finance/Utility) │
                          └──────────────┬──────────────┘
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │ SSRF & Injection Protection │
                          │ - Private IP Range Blocking │
                          │ - Prompt Isolation Delimiter│
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
                          │   Stage 2: Results View     │
                          │ - Radial Gauge & Takeaway   │
                          │ - Interactive Simulator     │
                          │ - Progressive Accordion     │
                          │ - Copyable Opt-Out Letter   │
                          └─────────────────────────────┘
```

### 3.1 Tech Stack
- **Framework:** Next.js (App Router) + React 19 + TypeScript (`strict: true`)
- **Styling:** Standard CSS with semantic design tokens (`src/app/globals.css`)
- **Typography:** Single font family (`Inter` with system sans-serif fallback)
- **Icons:** Inline SVG components (`src/components/Icons.tsx`) with `1.75px` stroke geometry — **zero emojis**
- **Testing:** Vitest (`vitest run` via `npm test`)
- **Repo Footprint:** Total tracked repository size is **0.21 MB**, strictly below the 10 MB hackathon limit.

### 3.2 Security & SSRF Protection
- **SSRF Defense:** URL link inputs are validated against private IPv4 addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `127.0.0.0/8`), loopback (`::1`, `localhost`), and non-HTTP protocols (`file:`, `ftp:`, `javascript:`).
- **Prompt Isolation:** Untrusted policy text is framed inside `<policy_text>` delimiters with delimiter breakout sequences sanitized.
- **Privacy Preservation:** Policy texts are evaluated in-memory and **never logged** to server logs, storage, or external telemetry.
- **Length Caps & Sanitization:** Enforces 45,000 character maximum and strips control characters to prevent memory exhaustion attacks.

### 3.3 Mathematical Probabilistic Scoring
Rather than a naive linear accumulator that clips at 100, ConsentLens computes risk via cumulative risk survival:

$$P(\text{Safe}) = \prod_{i=1}^{n} (1 - r_i)$$
$$\text{Risk Score} = \text{Round}\left(100 \times (1 - P(\text{Safe}))\right)$$

When an evaluator toggles off an invasive permission in the **Interactive Risk Simulator**, $P(\text{Safe})$ immediately increases, producing a live, non-saturating point reduction (`scoreDelta < 0`).

---

## 4. Verification & Testing

### Running Tests
```bash
# Execute automated unit tests (18 tests covering scoring, SSRF, injection defense, etc.)
npm test
```

### Building for Production
```bash
# Verify TypeScript strict mode compilation
npm run build
```

### Running Locally
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
