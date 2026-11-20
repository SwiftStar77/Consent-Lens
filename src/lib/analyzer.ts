import {
  AnalysisResult,
  RiskCategory,
  RiskItem,
  RiskSeverity,
  RiskTolerance,
  UsageContext,
  UserPersona,
} from './types';

interface ClauseRule {
  id: string;
  title: string;
  category: RiskCategory;
  defaultSeverity: RiskSeverity;
  baseWeight: number; // 0 to 100 weight
  individualRiskFactor: number; // 0.10 to 0.35 probability factor
  patterns: RegExp[];
  applicableContexts?: UsageContext[];
  isAnomalyIn?: UsageContext[];
  harmByPersona: Record<UserPersona, string>;
  plainLanguageNote: string;
  isToggleable: boolean;
}

const RULES: ClauseRule[] = [
  // 1. Contact Harvesting (Strict regex to avoid false positives on 'contact us' or 'support contact')
  {
    id: 'perm_contacts',
    title: 'Full Address Book & Contacts Access',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(read_contacts|get_accounts)\b/i,
      /\b(address\s*book|contact\s*list)\b/i,
      /\b(access( to)?|collect(ion of)?|harvest(ing)?|upload(ing)?|read(ing)?|export(ing)?)\s+[\w\s]{0,25}\b(telephone|mobile|user|phone|device)?\s*(contacts|address\s*book|phone\s*numbers)\b/i,
      /\b(contacts\s*and\s*call\s*logs?)\b/i,
      /\b(individuals\s*listed\s*in\s*your\s*mobile\s*address\s*book)\b/i,
    ],
    isAnomalyIn: ['utility', 'saas', 'health', 'finance'],
    harmByPersona: {
      everyday:
        'The app reads your entire contact list. If you miss a payment or have a dispute, your family and coworkers could receive collection calls or spam.',
      accessibility:
        'This app copies all names and numbers of your friends and family. They can be contacted without your permission.',
      privacy_pro:
        'Exfiltrates contact graph metadata and phonebook entries, enabling shadow profiling, non-consensual third-party tracking, and social debt collection.',
    },
    plainLanguageNote:
      'What happens: The app takes your contacts. Why it is unsafe: People you know may be messaged or called by strangers.',
    isToggleable: true,
  },

  // 2. SMS / Text Message Reading
  {
    id: 'perm_sms',
    title: 'Background SMS & Message Snooping',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 28,
    individualRiskFactor: 0.35,
    patterns: [
      /\b(read_sms|receive_sms|send_sms)\b/i,
      /\b(background\s*reading\s*of|intercept|access\s*to)\s+[\w\s]{0,20}\b(sms|text\s*messages?)\b/i,
      /\b(transactional\s*sms|sms\s*logs?|inbox\s*messages?|bank\s*statements?\s*via\s*sms)\b/i,
    ],
    isAnomalyIn: ['utility', 'saas', 'health', 'finance'],
    harmByPersona: {
      everyday:
        'The app can intercept two-factor authentication codes, bank transaction alerts, and private text conversations.',
      accessibility:
        'This app reads your personal text messages and secret bank codes.',
      privacy_pro:
        'Direct exfiltration of unencrypted SMS inbox messages. Subverts SMS-based 2FA mechanisms and facilitates unauthorized transaction profiling.',
    },
    plainLanguageNote:
      'What happens: The app can read your text messages. Why it is unsafe: It can see bank codes and private chats.',
    isToggleable: true,
  },

  // 3. Constant Background GPS Tracking
  {
    id: 'perm_location',
    title: 'Continuous Background Precise Location',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 22,
    individualRiskFactor: 0.28,
    patterns: [
      /\b(access_fine_location|access_background_location|fine_location)\b/i,
      /\b(gps\s*tracking|precise\s*location|background\s*location)\b/i,
      /\b(location\s*even\s*when\s*the\s*app\s*is\s*closed)\b/i,
    ],
    isAnomalyIn: ['utility', 'saas', 'finance'],
    harmByPersona: {
      everyday:
        'Tracks your precise physical movements 24/7, revealing your home, workplace, medical visits, and daily routines.',
      accessibility:
        'This app watches where you go at all times, even when you are not using it.',
      privacy_pro:
        'Harvests persistent high-resolution geolocation coordinates, creating granular mobility fingerprints susceptible to aggregation and subpoena.',
    },
    plainLanguageNote:
      'What happens: The app tracks your GPS location all day. Why it is unsafe: It knows where you sleep, work, and visit.',
    isToggleable: true,
  },

  // 4. Camera & Storage Access (Predatory Gallery / Biometric Scanning)
  {
    id: 'perm_camera_storage',
    title: 'Camera & Gallery Storage Scanning',
    category: 'data_collection',
    defaultSeverity: 'medium',
    baseWeight: 16,
    individualRiskFactor: 0.20,
    patterns: [
      /\b(camera\s*&|camera\s*permission|access\s*to\s*camera)\b/i,
      /\b(scan\s*device\s*gallery|borrower\s*selfies?|biometric\s*facial\s*scans?)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Can capture photos and inspect private pictures, documents, and downloads stored on your phone.',
      accessibility:
        'This app asks to use your camera and look at all files and pictures on your phone.',
      privacy_pro:
        'Requests broad filesystem storage enumeration and biometric facial imagery, posing identity theft and biometric capture hazards.',
    },
    plainLanguageNote:
      'What happens: The app can see your photos and use your camera. Why it is unsafe: Private photos might be uploaded.',
    isToggleable: true,
  },

  // 5. Debt Collection & Third-Party Broker Sharing
  {
    id: 'share_debt_brokers',
    title: 'Third-Party Data Brokering & Debt Harassment',
    category: 'third_party_sharing',
    defaultSeverity: 'high',
    baseWeight: 27,
    individualRiskFactor: 0.33,
    patterns: [
      /\b(collection\s*agencies|recovery\s*partners|telemarketing\s*affiliates|non-banking\s*financial|nbfc)\b/i,
      /\b(sell,\s*share,\s*or\s*license\s*your\s*contact\s*book)\b/i,
      /\b(contact\s*designated\s*emergency\s*contacts)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your private data and contact book are sold or given to aggressive third-party debt collectors who can call your contacts.',
      accessibility:
        'Strangers and debt collection callers will be given your information and your family members’ numbers.',
      privacy_pro:
        'Non-consensual third-party syndication without data processing agreements; violates core minimization and purpose limitation doctrines.',
    },
    plainLanguageNote:
      'What happens: Your info is given to debt collection companies. Why it is unsafe: They will call your friends if there is a dispute.',
    isToggleable: true,
  },

  // 6. Advertising Trackers & Session Replay
  {
    id: 'share_ad_tracking',
    title: 'Cross-Site Ad Profiling & Keystroke Recording',
    category: 'third_party_sharing',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(session-recording|keystroke\s*monitors?|meta\s*pixel|google\s*ad\s*services)\b/i,
      /\b(behavioral\s*promotions|track\s*user\s*behavior\s*across\s*partner\s*websites)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Monitors your keystrokes and shares your browsing activity with advertisers to target you with invasive ads.',
      accessibility:
        'The app watches every button you push and every word you type, sending that information to ad companies.',
      privacy_pro:
        'Deploys client-side session replay tools and cross-site telemetry trackers that capture unredacted PII and form input values.',
    },
    plainLanguageNote:
      'What happens: It records how you type and what pages you view. Why it is unsafe: Advertisers get a copy of your actions.',
    isToggleable: true,
  },

  // 7. Silent Auto-Renewal Trap
  {
    id: 'finance_silent_autorenewal',
    title: 'Silent Conversion to Expensive Annual Subscription',
    category: 'financial_lockin',
    defaultSeverity: 'high',
    baseWeight: 25,
    individualRiskFactor: 0.30,
    patterns: [
      /\b(automatically\s*converts\s*to\s*a\s*non-refundable|perpetual,\s*and\s*non-refundable)\b/i,
      /\b(auto-renewal|billed\s*upfront\s*at|automatic\s*conversion)\b/i,
      /\b(unless\s*explicitly\s*cancelled\s*via\s*certified\s*support\s*ticket)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your free evaluation quietly turns into a surprise multi-hundred-dollar annual charge on your card that cannot be refunded.',
      accessibility:
        'When the free trial ends, they will take money from your card for a whole year without asking you again.',
      privacy_pro:
        'Negative-option billing dark pattern designed to induce accidental annual commitment with zero proactive pre-billing notice.',
    },
    plainLanguageNote:
      'What happens: Free trial automatically changes to an expensive paid plan. Why it is unsafe: You will be charged money unexpectedly.',
    isToggleable: true,
  },

  // 8. Irrevocable Auto-Debit Mandate
  {
    id: 'finance_autodebit_mandate',
    title: 'Irrevocable Auto-Debit with Daily Penalties',
    category: 'financial_lockin',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(irrevocable\s*recurring\s*auto-debit|auto-debit\s*authority)\b/i,
      /\b(daily\s*penalty\s*interest|re-presentment\s*fees|without\s*prior\s*notice)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company has unilateral power to withdraw funds directly from your bank account or card with compounding daily penalties.',
      accessibility:
        'The company can take money straight out of your bank account whenever they want and add daily late fees.',
      privacy_pro:
        'Grants an un-rescindable banking debit mandate with punitive usurious fee structures and automated fund sweeps without dispute windows.',
    },
    plainLanguageNote:
      'What happens: The company can pull money from your bank account automatically. Why it is unsafe: They can drain your balance with late fees.',
    isToggleable: true,
  },

  // 9. AI Training License on Private User Content
  {
    id: 'legal_ai_training',
    title: 'Perpetual Commercial AI Training on Your Uploads',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 24,
    individualRiskFactor: 0.30,
    patterns: [
      /\b(train,\s*refine,\s*and\s*commercially\s*deploy\s*proprietary\s*artificial\s*intelligence)\b/i,
      /\b(train\s*(ai|machine\s*learning|models?)|perpetual,\s*irrevocable,\s*worldwide,\s*royalty-free\s*license)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Anything you upload (documents, notes, code, photos) becomes permanent training data for their commercial AI models forever.',
      accessibility:
        'Anything you write or upload into this app belongs to the company forever to teach their computers.',
      privacy_pro:
        'Expropriates customer intellectual property via broad irrevocable copyright licenses for model weight pre-training without compensation or deletion mechanisms.',
    },
    plainLanguageNote:
      'What happens: They use your private files to build AI products. Why it is unsafe: You cannot take back or delete your work from their AI.',
    isToggleable: true,
  },

  // 10. Mandatory Binding Arbitration & Class Action Waiver
  {
    id: 'legal_binding_arbitration',
    title: 'Court & Jury Trial Waiver (Forced Arbitration)',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 17,
    individualRiskFactor: 0.20,
    patterns: [
      /\b(mandatory\s*binding\s*arbitration|individual\s*binding\s*arbitration)\b/i,
      /\b(class\s*action\s*waiver|waive\s*all\s*rights\s*to\s*participate\s*in\s*class-action|confidential\s*individual\s*binding\s*arbitration)\b/i,
    ],
    harmByPersona: {
      everyday:
        'You give up your constitutional right to sue in court or join with other affected customers if the company rips you off.',
      accessibility:
        'If this company takes your money or breaks the law, you cannot take them to an ordinary court or join with other people.',
      privacy_pro:
        'Deprives consumers of judicial redress, discovery rights, and collective action leverage through confidential dispute resolution forums.',
    },
    plainLanguageNote:
      'What happens: You sign away your right to go to regular court. Why it is unsafe: It is almost impossible to fight unfair charges.',
    isToggleable: true,
  },

  // 11. Indefinite Data Retention
  {
    id: 'retention_indefinite',
    title: 'Indefinite Data Retention Surviving Account Deletion',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(retained\s*indefinitely|surviving\s*account\s*termination|cross-service\s*credit\s*profiling)\b/i,
      /\b(perpetual\s*retention|retain\s*data\s*forever|indefinitely\s*for\s*risk\s*modeling)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Even if you delete the app and close your account, they keep all your sensitive records on file forever.',
      accessibility:
        'Even if you delete the app, the company keeps all your personal records forever.',
      privacy_pro:
        'Direct violation of GDPR Article 5(1)(e) storage limitation principles; preserves persistent behavioral data lakes indefinitely.',
    },
    plainLanguageNote:
      'What happens: They keep your data even if you delete the app. Why it is unsafe: A future data leak will expose your old records.',
    isToggleable: true,
  },
];

/**
 * Checks if a sentence explicitly negates the clause (e.g. "We do not sell or share", "Zero tracking").
 */
function isNegatedStatement(sentence: string): boolean {
  return /\b(do\s*not|does\s*not|will\s*not|never|no|zero|without|neither|nor|not\s*required)\s+[\w\s]{0,35}\b(sell|share|track|collect|record|transfer|require|access|charge|convert)\b/i.test(
    sentence
  );
}

/**
 * Extracts an exact matching sentence or snippet from the policy text.
 * Returns null if no actual sentence matches or if the sentence contains an active negation.
 */
function extractMatchingSnippet(text: string, pattern: RegExp): string | null {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  for (const sentence of sentences) {
    if (pattern.test(sentence)) {
      if (isNegatedStatement(sentence)) {
        continue;
      }
      const trimmed = sentence.trim();
      return trimmed.length > 220 ? trimmed.substring(0, 217) + '...' : trimmed;
    }
  }
  return null;
}

/**
 * Generates an executive verdict tailored to the selected persona and severity.
 */
function generateExecutiveVerdict(
  severity: RiskSeverity,
  score: number,
  findingsCount: number,
  persona: UserPersona,
  context: UsageContext,
  anomaliesCount: number
): string {
  if (severity === 'safe' || score < 20 || findingsCount === 0) {
    switch (persona) {
      case 'accessibility':
        return 'Good news: No major red flags were found in this agreement. It does not ask for dangerous permissions or contain hidden charges.';
      case 'privacy_pro':
        return 'Minimal threat surface detected. The provided terms respect data minimization and lack predatory tracking or indefinite retention covenants.';
      case 'everyday':
      default:
        return 'No major red flags were found in the provided text. The terms appear transparent and request only standard, scoped permissions.';
    }
  }

  if (severity === 'high' || score >= 68) {
    switch (persona) {
      case 'accessibility':
        return `Danger: We found ${findingsCount} serious risks. This app wants private access that it does not need and can share your personal information. Do not install or agree to this without turning off dangerous permissions.`;
      case 'privacy_pro':
        return `Critical risk posture (${score}/100). The agreement exhibits severe surveillance clauses, third-party brokering, ${anomaliesCount > 0 ? 'category permission anomalies, ' : ''}and forced dispute waivers that violate standard user privacy rights.`;
      case 'everyday':
      default:
        return `High risk alert (${score}/100). This agreement contains predatory terms including aggressive personal data access and potential financial lock-ins. We strongly recommend rejecting optional permissions or seeking safer alternatives.`;
    }
  }

  // Medium / Low risk
  switch (persona) {
    case 'accessibility':
      return `Caution: We found ${findingsCount} items you should know about. Some permissions or charges may happen automatically if you do not cancel in time. Read the steps below before agreeing.`;
    case 'privacy_pro':
      return `Moderate exposure profile (${score}/100). Identifies vendor-friendly terms including third-party telemetry, subscription renewal defaults, and legal limitations that warrant active mitigation.`;
    case 'everyday':
    default:
      return `Moderate risk detected (${score}/100). While typical for commercial apps, these terms include auto-renewal mechanisms and marketing telemetry that require your attention.`;
  }
}

/**
 * Generates actionable countermeasures.
 */
function generateCountermeasures(
  findings: RiskItem[],
  persona: UserPersona,
  context: UsageContext
): string[] {
  const steps: string[] = [];

  const hasContacts = findings.some((f) => f.id === 'perm_contacts');
  const hasSms = findings.some((f) => f.id === 'perm_sms');
  const hasGps = findings.some((f) => f.id === 'perm_location');
  const hasAutoRenew = findings.some((f) => f.id === 'finance_silent_autorenewal');
  const hasAutoDebit = findings.some((f) => f.id === 'finance_autodebit_mandate');
  const hasAiTraining = findings.some((f) => f.id === 'legal_ai_training');
  const hasBrokers = findings.some((f) => f.id === 'share_debt_brokers');

  if (hasContacts) {
    steps.push(
      persona === 'accessibility'
        ? 'Open your phone Settings, tap Apps, tap this app, and set "Contacts" to "Don\'t allow".'
        : 'Deny the "Contacts" permission in OS settings to prevent address book synchronization and collection access.'
    );
  }

  if (hasSms) {
    steps.push(
      persona === 'accessibility'
        ? 'Do not allow this app to read SMS text messages. Enter one-time bank codes by hand instead.'
        : 'Block SMS access. Manually input OTP authentication codes rather than granting full inbox read permissions.'
    );
  }

  if (hasGps) {
    steps.push(
      persona === 'accessibility'
        ? 'Set Location to "Only while using the app" or "Don\'t allow" so it cannot track your daily travels.'
        : 'Downgrade location permission to "Approximate" or "Only while using the app" to prevent persistent background logging.'
    );
  }

  if (hasAutoRenew) {
    steps.push(
      persona === 'accessibility'
        ? 'Set an alarm on your calendar right now for 3 days before the trial ends so you can cancel before being charged.'
        : 'Set a calendar reminder 5 days before trial expiration, or subscribe using a virtual card with a $1 spending limit.'
    );
  }

  if (hasAutoDebit) {
    steps.push(
      persona === 'accessibility'
        ? 'Check your online banking app and turn off any auto-pay mandates you did not agree to.'
        : 'Inspect your banking portal or UPI app to revoke unilateral recurring debit mandates and set transaction limits.'
    );
  }

  if (hasAiTraining) {
    steps.push(
      persona === 'accessibility'
        ? 'Do not upload private documents, taxes, or sensitive pictures to this workspace.'
        : 'Send an opt-out request forbidding commercial AI model training on your proprietary corporate files and user uploads.'
    );
  }

  if (hasBrokers) {
    steps.push(
      persona === 'accessibility'
        ? 'Copy the message below and email it to the app support team to tell them they cannot sell your data.'
        : 'Submit a formal opt-out / deletion request citing consumer data rights to restrict data brokering to collection affiliates.'
    );
  }

  if (steps.length === 0) {
    steps.push(
      persona === 'accessibility'
        ? 'No special actions needed. The provided terms respect standard digital privacy boundaries.'
        : 'Standard hygiene: ensure you install only from verified app stores and review permissions periodically.'
    );
  }

  return steps;
}

/**
 * Builds a customized, ready-to-copy opt-out or data-rights letter.
 */
function generateOptOutDraft(
  findings: RiskItem[],
  persona: UserPersona,
  context: UsageContext
): string {
  const dateStr = new Date().toISOString().split('T')[0];

  if (findings.length === 0) {
    return `Subject: Privacy Confirmation

Date: ${dateStr}
To: Customer Support

Hello,
I have reviewed your current terms and privacy notice. No opt-out or deletion request is required at this time as the provided terms follow standard data minimization.

Thank you.`;
  }

  if (persona === 'accessibility') {
    return `Subject: Please delete my data and stop sharing it

Date: ${dateStr}
To: Customer Support

Hello,
I use your service, but I do not agree to you sharing my personal information.

Please do the following for my account:
1. Do not share or sell my information, contact book, or phone number to any third parties or advertisers.
2. Do not use any documents or files I uploaded to train AI or computer models.
3. If I delete my account, please completely erase all my data from your computers.

Please reply to confirm that you have updated my account.

Thank you.`;
  }

  if (persona === 'privacy_pro') {
    return `FORMAL NOTICE OF DATA RIGHTS EXERCISE & RESTRICTION OF PROCESSING

Date: ${dateStr}
To: Data Protection Officer / Legal Privacy Team
Re: Exercise of Data Subject Rights (GDPR Art. 17/18/21, CCPA/CPRA § 1798.120)

To Whom It May Concern:

I am writing as an active user of your platform to formally exercise my statutory privacy rights regarding the processing, sharing, and retention of my personal and telemetry data:

1. PROHIBITION OF SALE / SHARING: I hereby opt out of any sale, commercial licensing, or sharing of my personal information, contact graph, device identifiers, or telemetry to third-party data brokers, marketing affiliates, or debt recovery partners.
2. AI TRAINING OPT-OUT: I formally revoke and withhold all consent for any uploads, code, documents, or communications associated with my account to be ingested, indexed, or utilized for AI/LLM model training or dataset construction.
3. RESTRAINT OF SURVEILLANCE & MANDATES: I decline non-essential telemetry, background tracking, and any recurring auto-debit authorizations not explicitly confirmed in a separate standalone agreement.
4. ERASURE ON CLOSURE: Upon termination of this account, all data must be irreversibly scrubbed within 30 days per data minimization mandates.

Please acknowledge receipt within statutory deadlines and confirm implementation in writing.

Sincerely,
Authorized Account Holder`;
  }

  // Everyday User
  return `Subject: Privacy Request: Opt-out of data sharing and auto-renewal review

Date: ${dateStr}
To: Privacy & Support Team

Hi there,

I am writing regarding my account and the privacy settings for your application:

1. Opt-out of third-party sharing: Please do not sell or share my contacts, location, or usage data with third-party advertisers or partner companies.
2. AI training opt-out: Please ensure my uploaded files and notes are excluded from any AI model training datasets.
3. Subscription transparency: Please ensure my account is not enrolled in silent annual auto-renewals without prior email notification at least 7 days in advance.

Please confirm that these restrictions have been applied to my account.

Regards,
Account User`;
}

/**
 * Calculates raw risk score from active findings and configuration.
 * Uses a cumulative probabilistic risk reduction model so each individual finding
 * has a measurable, non-saturating impact.
 */
export function calculateScoreFromFindings(
  findings: RiskItem[],
  persona: UserPersona,
  context: UsageContext,
  tolerance: RiskTolerance
): { score: number; verdictSeverity: RiskSeverity } {
  const activeFindings = findings.filter((f) => !f.isSimulatedDisabled);

  if (activeFindings.length === 0) {
    return { score: 0, verdictSeverity: 'safe' };
  }

  // Calculate cumulative survival probability: P(safe) = Product(1 - r_i)
  let survivalProb = 1.0;

  for (const item of activeFindings) {
    let factor = Math.min(0.40, Math.max(0.12, item.weight / 80));

    if (tolerance === 'strict') {
      factor = Math.min(0.50, factor * 1.25);
    }

    if (persona === 'privacy_pro') {
      if (item.category === 'third_party_sharing' || item.category === 'retention_security') {
        factor = Math.min(0.50, factor * 1.2);
      }
    } else if (persona === 'accessibility') {
      if (item.category === 'financial_lockin') {
        factor = Math.min(0.50, factor * 1.2);
      }
    }

    survivalProb *= (1.0 - factor);
  }

  const rawRisk = (1.0 - survivalProb) * 100;
  const scaledScore = Math.min(100, Math.max(0, Math.round(rawRisk)));

  let verdictSeverity: RiskSeverity = 'safe';
  if (scaledScore >= 68) {
    verdictSeverity = 'high';
  } else if (scaledScore >= 40) {
    verdictSeverity = 'medium';
  } else if (scaledScore >= 20) {
    verdictSeverity = 'low';
  } else {
    verdictSeverity = 'safe';
  }

  return { score: scaledScore, verdictSeverity };
}

/**
 * Interactive Risk Simulator recalculation function.
 * Called when toggling permission/clause switches in the UI.
 */
export function recalculateRiskScore(
  findings: RiskItem[],
  persona: UserPersona,
  context: UsageContext,
  tolerance: RiskTolerance
): {
  recalculatedScore: number;
  recalculatedSeverity: RiskSeverity;
  scoreDelta: number;
  executiveVerdict: string;
} {
  const original = calculateScoreFromFindings(
    findings.map((f) => ({ ...f, isSimulatedDisabled: false })),
    persona,
    context,
    tolerance
  );

  const updated = calculateScoreFromFindings(findings, persona, context, tolerance);
  const scoreDelta = updated.score - original.score;

  const activeCount = findings.filter((f) => !f.isSimulatedDisabled).length;
  const verdict = generateExecutiveVerdict(
    updated.verdictSeverity,
    updated.score,
    activeCount,
    persona,
    context,
    0
  );

  return {
    recalculatedScore: updated.score,
    recalculatedSeverity: updated.verdictSeverity,
    scoreDelta,
    executiveVerdict: verdict,
  };
}

/**
 * Deterministic Heuristic Risk Analyzer.
 * Strictly text-grounded: ONLY flags risks if an exact matching excerpt exists in policyText.
 */
export function analyzeDeterministically(
  policyText: string,
  persona: UserPersona,
  context: UsageContext,
  tolerance: RiskTolerance
): AnalysisResult {
  const matchedFindings: RiskItem[] = [];
  const permissionAnomalies: string[] = [];

  for (const rule of RULES) {
    let matchedSnippet: string | null = null;
    for (const pattern of rule.patterns) {
      const snippet = extractMatchingSnippet(policyText, pattern);
      if (snippet) {
        matchedSnippet = snippet;
        break;
      }
    }

    // STRICT ZERO-HALLUCINATION GUARD:
    // If no verifiable snippet matching the rule exists in the text, DO NOT flag it!
    if (!matchedSnippet) {
      continue;
    }

    if (rule.isAnomalyIn && rule.isAnomalyIn.includes(context)) {
      permissionAnomalies.push(
        `Permission "${rule.title}" is abnormal and high-risk for the "${context.toUpperCase()}" category.`
      );
    }

    matchedFindings.push({
      id: rule.id,
      title: rule.title,
      description: rule.harmByPersona[persona],
      category: rule.category,
      severity: rule.defaultSeverity,
      matchedExcerpt: matchedSnippet,
      originalClause: matchedSnippet,
      harm: rule.harmByPersona[persona],
      plainLanguageNote: rule.plainLanguageNote,
      isToggleable: rule.isToggleable,
      isSimulatedDisabled: false,
      weight: rule.baseWeight,
    });
  }

  // Calculate score
  const { score, verdictSeverity } = calculateScoreFromFindings(
    matchedFindings,
    persona,
    context,
    tolerance
  );

  const executiveVerdict = generateExecutiveVerdict(
    verdictSeverity,
    score,
    matchedFindings.length,
    persona,
    context,
    permissionAnomalies.length
  );

  const countermeasures = generateCountermeasures(matchedFindings, persona, context);
  const optOutDraft = generateOptOutDraft(matchedFindings, persona, context);

  return {
    score,
    verdictSeverity,
    executiveVerdict,
    findings: matchedFindings,
    permissionAnomalies,
    countermeasures,
    optOutDraft,
    engineUsed: 'local_rule_engine',
    analyzedAt: new Date().toISOString(),
  };
}
