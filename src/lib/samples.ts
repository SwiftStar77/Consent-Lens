import { ScenarioSample } from './types';

export const SAMPLE_SCENARIOS: ScenarioSample[] = [
  {
    id: 'predatory_loan',
    name: 'Predatory Instant Loan App (High Risk)',
    description: 'Aggressive permissions (Contacts, SMS, GPS) with debt collection clauses and auto-debit.',
    defaultPersona: 'everyday',
    defaultContext: 'finance',
    defaultTolerance: 'standard',
    content: `InstantCash Pro Mobile Application – Permissions & Terms of Service

Required Device Permissions:
1. READ_CONTACTS & GET_ACCOUNTS: Access to complete telephone address book, contact names, phone numbers, and call logs to verify social creditworthiness and facilitate emergency notifications.
2. READ_SMS & RECEIVE_SMS: Continuous background reading of transactional and personal SMS messages to evaluate cashflow velocity and verify bank statements.
3. ACCESS_FINE_LOCATION: Constant real-time GPS tracking even when the app is closed, used to verify residential stability and prevent loan fraud.
4. CAMERA & READ_EXTERNAL_STORAGE: Access to capture borrower selfies, biometric facial scans, and scan device gallery storage.

Data Sharing & Third Parties (Section 4):
We reserve the right to share, sell, or license your contact book, transaction histories, and device identifiers to third-party collection agencies, recovery partners, telemarketing affiliates, and non-banking financial companies (NBFCs). In the event of default or payment delay exceeding 48 hours, our automated dispatch system may contact designated emergency contacts and individuals listed in your mobile address book.

Billing & Auto-Debit Mandate (Section 7):
By accepting these terms, you grant InstantCash Pro an irrevocable recurring auto-debit authority on all linked bank accounts, UPI IDs, and debit cards. In the event of insufficient funds, re-presentment fees and daily penalty interest of 1.5% per day will be levied automatically without prior notice.

Dispute Resolution & Retention (Section 11):
You waive all rights to participate in class-action lawsuits or jury trials. All disputes must be settled through individual binding arbitration held in an offshore jurisdiction. Data collected will be retained indefinitely for risk modeling and cross-service credit profiling, surviving account termination or app uninstallation.`,
  },
  {
    id: 'saas_trial',
    name: 'SaaS Productivity & AI Tool (Medium-High Risk)',
    description: 'Silent annual auto-renewal trap, AI training on user documents, and arbitration waiver.',
    defaultPersona: 'privacy_pro',
    defaultContext: 'saas',
    defaultTolerance: 'strict',
    content: `TaskFlow Cloud Workspace – End User Subscription Agreement

Section 2. Free Trial & Auto-Renewal:
Upon registration, your account is enrolled in a 7-day complimentary evaluation trial. Unless explicitly cancelled via certified support ticket at least 30 business days prior to trial conclusion, your subscription automatically converts to a non-refundable Annual Enterprise Tier billed upfront at $348/year. All renewals are automatic, perpetual, and non-refundable under any circumstance.

Section 5. User Content, Intellectual Property & AI Training:
You retain nominal ownership of files uploaded to TaskFlow Cloud. However, by uploading, editing, or storing documents, transcripts, code, or images, you grant TaskFlow and its affiliates a perpetual, irrevocable, worldwide, royalty-free license to use, reproduce, modify, analyze, and distribute your content to train, refine, and commercially deploy proprietary artificial intelligence and machine learning models.

Section 8. Telemetry, Session Recording & Analytics:
We deploy session-recording technologies, keystroke monitors, and third-party advertising SDKs (including Meta Pixel and Google Ad Services) to track user behavior across partner websites and deliver personalized behavioral promotions.

Section 14. Mandatory Binding Arbitration & Class Action Waiver:
All claims arising out of this agreement must be submitted to confidential individual binding arbitration administered in Wilmington, Delaware. You agree that you may bring claims against TaskFlow only in your individual capacity, and not as a plaintiff or class member in any purported class or representative proceeding.`,
  },
  {
    id: 'safe_utility',
    name: 'Offline Markdown Reader (Safe Baseline)',
    description: 'Clean local tool requesting only local file access, zero trackers, and explicit local deletion.',
    defaultPersona: 'accessibility',
    defaultContext: 'utility',
    defaultTolerance: 'standard',
    content: `LiteDoc Markdown Viewer – Privacy Policy & Permission Notice

Scope & Operating Principle:
LiteDoc is an offline document viewer. It does not operate remote servers, does not maintain user accounts, and does not require internet connectivity to function.

Requested Device Permissions:
1. READ_MEDIA_DOCUMENTS / READ_EXTERNAL_STORAGE: Required strictly to allow you to open, display, and edit markdown (.md) and text files that you explicitly choose from your file explorer.
2. WRITE_EXTERNAL_STORAGE: Required only when you explicitly select "Export to PDF" or "Save Copy" to write the file back to your device storage.

Zero Data Collection & Telemetry:
LiteDoc contains no third-party tracking libraries, analytics SDKs, advertising frameworks, or crash-reporting services that phone home. No telemetry, device fingerprints, or document contents are ever transmitted over the network.

Data Retention & Removal:
All files remain strictly on your local device. Uninstalling the application or clearing app cache completely removes all cached preferences and temporary file references with zero trace.`,
  },
];
