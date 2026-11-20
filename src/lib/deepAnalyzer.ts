import {
  AnalysisResult,
  RiskCategory,
  RiskItem,
  RiskSeverity,
  RiskTolerance,
  UsageContext,
  UserPersona,
} from './types';

export interface DeepRule {
  id: string;
  title: string;
  category: RiskCategory;
  defaultSeverity: RiskSeverity;
  baseWeight: number; // 8 to 30
  individualRiskFactor: number; // 0.08 to 0.38
  patterns: RegExp[];
  harmByPersona: Record<UserPersona, string>;
  plainLanguageNote: string;
  isToggleable: boolean;
  optOutClause?: string;
}

export const DEEP_RULES: DeepRule[] = [
  // =========================================================================
  // CATEGORY 1: DATA HARVESTING & SENSITIVE PERMISSIONS
  // =========================================================================
  {
    id: 'perm_contacts',
    title: 'Full Address Book & Contacts Harvesting',
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
    harmByPersona: {
      everyday:
        'The app reads your entire contact list. Your family, friends, and coworkers can be mapped, spammed, or called by collection agents.',
      accessibility:
        'This app copies all names and phone numbers of people in your contact list without asking them.',
      privacy_pro:
        'Exfiltrates device contact graph and phonebook entries, enabling social debt collection, shadow profiling, and non-consensual third-party tracking.',
    },
    plainLanguageNote:
      'What happens: The app takes your contacts. Why it is unsafe: Strangers and lenders can contact everyone you know.',
    isToggleable: true,
    optOutClause: 'Revoke and delete all synced address book contacts and family phone records from your databases.',
  },
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
    harmByPersona: {
      everyday:
        'The app can intercept two-factor authentication codes, bank transaction alerts, and private text conversations.',
      accessibility:
        'This app reads your personal text messages and secret bank codes.',
      privacy_pro:
        'Direct exfiltration of unencrypted SMS inbox messages. Subverts SMS-based 2FA mechanisms and facilitates unauthorized transaction profiling.',
    },
    plainLanguageNote:
      'What happens: The app reads your text messages. Why it is unsafe: It can see bank OTP codes and private messages.',
    isToggleable: true,
    optOutClause: 'Immediately cease parsing transactional or personal SMS messages and erase all intercepted inbox content.',
  },
  {
    id: 'perm_location',
    title: 'Persistent Real-Time GPS Tracking',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 24,
    individualRiskFactor: 0.28,
    patterns: [
      /\b(access_fine_location|access_coarse_location|access_background_location)\b/i,
      /\b(precise\s*(gps|geographic|geolocation|location)\s*(data|coordinates?|tracking))\b/i,
      /\b(continuous(ly)?|persistent(ly)?|background)\s+[\w\s]{0,20}\b(track(ing)?|monitor(ing)?|record(ing)?)\s+[\w\s]{0,15}\b(location|gps|movement)\b/i,
      /\b(exact\s*physical\s*location\s*at\s*all\s*times)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Tracks your precise real-time location around the clock, revealing your home, workplace, medical visits, and daily travel routes.',
      accessibility:
        'This app tracks everywhere you walk, drive, or visit at all times.',
      privacy_pro:
        'Unbounded continuous geolocation telemetry generates high-resolution lifestyle patterns, sleep schedules, and sensitive destination visits.',
    },
    plainLanguageNote:
      'What happens: Tracks your exact physical location continuously. Why it is unsafe: Reveals where you live, work, and visit.',
    isToggleable: true,
    optOutClause: 'Disable persistent geolocation tracking and purge all historical GPS coordinate breadcrumbs.',
  },
  {
    id: 'perm_audio',
    title: 'Background Audio Recording & Microphone Access',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(record_audio|modify_audio_settings)\b/i,
      /\b(record(ing)?|capture|listen(ing)?)\s+[\w\s]{0,20}\b(audio|microphone|ambient\s*sound|conversations?)\b/i,
      /\b(access( to)?\s+the\s+device\s*microphone\s*(in\s+the\s+background)?)\b/i,
      /\b(voice\s*recordings?\s*and\s*environmental\s*audio)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The app can listen to ambient room sounds and private discussions through your phone microphone.',
      accessibility:
        'This app can turn on your microphone and record what you say in the room.',
      privacy_pro:
        'Environmental acoustic monitoring enables offline conversion tracking, device co-location, and private conversation analysis without visual indicator.',
    },
    plainLanguageNote:
      'What happens: Records audio from your microphone. Why it is unsafe: Can overhear private conversations in your home.',
    isToggleable: true,
    optOutClause: 'Revoke microphone recording permissions and permanently delete all stored voice or ambient audio files.',
  },
  {
    id: 'perm_camera',
    title: 'Unrestricted Camera & Video Access',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 24,
    individualRiskFactor: 0.28,
    patterns: [
      /\b(android\.permission\.camera|permission\.camera)\b/i,
      /\b(access( to)?|capture|record(ing)?)\s+[\w\s]{0,20}\b(camera|video|photos?|visual\s*data)\s*(without\s*(prior\s*)?notice)?\b/i,
      /\b(take\s*photographs?\s*and\s*videos?\s*at\s*any\s*time)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The app requests broad camera access and may capture images or video clips beyond when you actively use the camera.',
      accessibility:
        'This app can access your camera and see pictures or take video through your phone.',
      privacy_pro:
        'Broad camera capture privileges permit background imagery sampling and visual environment inspection.',
    },
    plainLanguageNote:
      'What happens: Accesses your phone camera. Why it is unsafe: May capture photos or videos unexpectedly.',
    isToggleable: true,
    optOutClause: 'Restrict camera access strictly to in-app manual photo snapping and purge unprompted photo captures.',
  },
  {
    id: 'perm_keystrokes',
    title: 'Keystroke & Input Logging',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 28,
    individualRiskFactor: 0.35,
    patterns: [
      /\b(keystrokes?|key\s*logging|keyboard\s*inputs?)\b/i,
      /\b(track(ing)?|record(ing)?|monitor(ing)?|log(ging)?)\s+[\w\s]{0,20}\b(keystrokes?|keys\s*pressed|typing\s*patterns?|input\s*fields?)\b/i,
      /\b(all\s*text\s*typed\s*(into\s*the\s*application|on\s*your\s*device))\b/i,
    ],
    harmByPersona: {
      everyday:
        'Logs every character you type, potentially capturing passwords, credit card numbers, and confidential messages.',
      accessibility:
        'This app records every word and letter you type on your keyboard.',
      privacy_pro:
        'Kernel or web-level keystroke interception captures uncommitted input strings, credentials, and sensitive notes prior to submission.',
    },
    plainLanguageNote:
      'What happens: Tracks what you type. Why it is unsafe: Can steal passwords and private messages as you type them.',
    isToggleable: true,
    optOutClause: 'Immediately cease logging keystroke cadences or text input and delete all captured keyboard logs.',
  },
  {
    id: 'perm_biometrics',
    title: 'Biometric & Facial Recognition Collection',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(biometric\s*(data|identifiers?|information|scans?|templates?))\b/i,
      /\b(facial\s*(geometry|recognition|scans?)|face\s*prints?)\b/i,
      /\b(fingerprint\s*(data|scans?|templates?)|voiceprints?|retina\s*scans?)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Extracts permanent biometric markers such as facial scans or fingerprints. Unlike passwords, compromised biometrics cannot be changed.',
      accessibility:
        'This app scans your face or fingerprints and saves them.',
      privacy_pro:
        'Irrevocable biometric identity indexing subject to BIPA violations; exposes unique physical traits to permanent data breach vulnerability.',
    },
    plainLanguageNote:
      'What happens: Scans your face or fingerprint. Why it is unsafe: You cannot reset your face if their database is leaked.',
    isToggleable: true,
    optOutClause: 'Destroy all stored biometric templates, faceprints, and fingerprint records per BIPA guidelines.',
  },
  {
    id: 'perm_device_fingerprint',
    title: 'Hardware Fingerprinting & App Inventory Logging',
    category: 'data_collection',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(device\s*fingerprint(ing)?|hardware\s*serial\s*number|imei|mac\s*address)\b/i,
      /\b(installed\s*(applications?|apps|packages?)\s*(list|inventory)?)\b/i,
      /\b(query_all_packages|get_installed_apps)\b/i,
      /\b(battery\s*level|sensor\s*data|gyroscope|accelerometer\s*readings?)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Scans all other apps installed on your device and tracks your unique hardware serial numbers even if you reinstall the app.',
      accessibility:
        'This app looks at what other apps you have on your phone and writes down your phone serial number.',
      privacy_pro:
        'Cross-application surveillance via installed package enumeration and persistent device fingerprinting resists private browsing and ad ID resets.',
    },
    plainLanguageNote:
      'What happens: Catalogs what other apps you use and tracks your device. Why it is unsafe: Follows you across different apps.',
    isToggleable: true,
    optOutClause: 'Cease enumerating installed package lists and purge device fingerprinting identifiers.',
  },
  {
    id: 'perm_call_logs',
    title: 'Call History & Phone Call Logging',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 25,
    individualRiskFactor: 0.30,
    patterns: [
      /\b(read_call_log|write_call_log|process_outgoing_calls)\b/i,
      /\b(call\s*logs?|call\s*history|records?\s*of\s*incoming\s*and\s*outgoing\s*calls?)\b/i,
      /\b(duration\s*of\s*calls?|caller\s*phone\s*numbers?)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Tracks who you call, when you call them, and how long you speak. Can be used for aggressive debt harassment and social mapping.',
      accessibility:
        'This app reads your list of recent phone calls and sees who you called.',
      privacy_pro:
        'Complete telephony metadata exfiltration revealing communication frequency, social nodes, and professional relationship graphs.',
    },
    plainLanguageNote:
      'What happens: Looks at your phone call records. Why it is unsafe: Sees who you speak with and when.',
    isToggleable: true,
    optOutClause: 'Delete all logged telephony metadata, timestamps, and caller identification records.',
  },

  // =========================================================================
  // CATEGORY 2: THIRD-PARTY SHARING & MONETIZATION
  // =========================================================================
  {
    id: 'share_sell_rent',
    title: 'Selling or Renting Personal Data',
    category: 'third_party_sharing',
    defaultSeverity: 'high',
    baseWeight: 28,
    individualRiskFactor: 0.36,
    patterns: [
      /\b(sell(ing)?|rent(ing)?|lease|monetiz(e|ing)|commercialize)\s+[\w\s]{0,25}\b(personal\s*(data|information)|user\s*data|consumer\s*records?)\b/i,
      /\b(we\s*may\s*sell|data\s*may\s*be\s*sold\s*or\s*rented)\b/i,
      /\b(share\s*for\s*(monetary|financial|commercial)\s*(consideration|gain|compensation))\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company explicitly reserves the right to sell or rent your personal information to outside companies for profit.',
      accessibility:
        'This company can sell your name, email, and personal information to other businesses for money.',
      privacy_pro:
        'Explicit commercialization of user dataset violating California CCPA § 1798.120 and GDPR data minimization requirements.',
    },
    plainLanguageNote:
      'What happens: They sell your data to other companies. Why it is unsafe: Your information is treated as a product for profit.',
    isToggleable: true,
    optOutClause: 'I exercise my right to opt out of the sale or rental of all my personal data per statutory privacy laws.',
  },
  {
    id: 'share_marketing_partners',
    title: 'Broad Sharing with Unnamed Marketing Affiliates',
    category: 'third_party_sharing',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(share(d)?\s+with|disclose(d)?\s+to)\s+[\w\s]{0,30}\b(marketing\s*partners?|advertising\s*affiliates?|commercial\s*sponsors?|unnamed\s*third\s*parties|selected\s*partners?)\b/i,
      /\b(promotional\s*partners?\s*for\s*(their\s*own\s*)?direct\s*marketing)\b/i,
      /\b(third\s*party\s*marketers?\s*and\s*advertisers)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your contact info and profile can be distributed to hundreds of commercial partners, resulting in unsolicited spam calls, texts, and emails.',
      accessibility:
        'This company shares your information with other companies who will send you junk mail and ads.',
      privacy_pro:
        'Broad affiliate sharing covenants enable cross-merchant consumer profiling without affirmative transactional consent.',
    },
    plainLanguageNote:
      'What happens: Shares your details with marketing partners. Why it is unsafe: Results in endless spam and promotional calls.',
    isToggleable: true,
    optOutClause: 'Cease sharing any of my personal details with external marketing affiliates or promotional sponsors.',
  },
  {
    id: 'share_debt_brokers',
    title: 'Data Broker & Collection Agency Syndication',
    category: 'third_party_sharing',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.33,
    patterns: [
      /\b(data\s*brokers?|credit\s*bureaus?|collection\s*agenc(y|ies)|recovery\s*agents?)\b/i,
      /\b(share\s*with|disclose\s*to|transfer\s*to)\s+[\w\s]{0,25}\b(debt\s*collectors?|credit\s*reporting\s*agenc(y|ies)|aggregators?)\b/i,
      /\b(for\s*the\s*purpose\s*of\s*debt\s*recovery\s*or\s*credit\s*assessment)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your contacts, payment history, and location can be handed to debt recovery agencies and commercial data aggregators.',
      accessibility:
        'This company can give your info to collection agencies or credit companies who may chase you for payments.',
      privacy_pro:
        'Unregulated syndication to debt recovery affiliates and data brokers exposes users to aggressive offline collection tactics.',
    },
    plainLanguageNote:
      'What happens: Sends your info to debt collectors and data brokers. Why it is unsafe: Strangers can contact you about money.',
    isToggleable: true,
    optOutClause: 'Immediately cease syndicating or distributing my contact and account records to debt recovery affiliates or data brokers.',
  },
  {
    id: 'share_ad_tracking',
    title: 'Cross-Context Behavioral Ad Tracking',
    category: 'third_party_sharing',
    defaultSeverity: 'medium',
    baseWeight: 17,
    individualRiskFactor: 0.20,
    patterns: [
      /\b(cross-context\s*behavioral\s*advertising|targeted\s*advertis(ing|ements?)|interest-based\s*ads?)\b/i,
      /\b(track(ing)?\s*(your\s*)?activity\s*across\s*(other\s*)?(websites|apps|platforms))\b/i,
      /\b(create\s*a\s*commercial\s*profile|behavioral\s*profiling)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Tracks what you browse and buy across other websites to build a psychological profile for targeted advertising.',
      accessibility:
        'This company watches what you look at on other websites so they can show you ads.',
      privacy_pro:
        'Cross-site behavioral telemetry feeds programmatic RTB (real-time bidding) advertising auction exchanges.',
    },
    plainLanguageNote:
      'What happens: Tracks you across the web to show ads. Why it is unsafe: Builds an invasive dossier on your private browsing.',
    isToggleable: true,
    optOutClause: 'I opt out of all cross-context behavioral advertising and commercial profiling activities.',
  },
  {
    id: 'share_ad_sdks',
    title: 'Embedded Third-Party Ad SDKs & Trackers',
    category: 'third_party_sharing',
    defaultSeverity: 'medium',
    baseWeight: 16,
    individualRiskFactor: 0.18,
    patterns: [
      /\b(third\s*party\s*(sdks?|software\s*development\s*kits?|trackers?|pixels?|web\s*beacons?))\b/i,
      /\b(analytics\s*and\s*advertising\s*(sdks?|libraries|partners?))\b/i,
      /\b(allow\s*third\s*parties\s*to\s*collect\s*information\s*directly\s*through\s*(our\s*)?(service|app))\b/i,
    ],
    harmByPersona: {
      everyday:
        'Third-party analytics and advertising tools run inside the app, sending your telemetry to foreign servers.',
      accessibility:
        'Other advertising companies have code inside this app that monitors what you do.',
      privacy_pro:
        'Undisclosed embedded SDK binaries bypass local consent controls by establishing direct telemetry conduits to ad networks.',
    },
    plainLanguageNote:
      'What happens: Foreign ad software runs inside the app. Why it is unsafe: Leaks your usage without your direct knowledge.',
    isToggleable: true,
    optOutClause: 'Block all third-party tracking pixels and ad network telemetry associated with this user ID.',
  },

  // =========================================================================
  // CATEGORY 3: FINANCIAL TRAPS & DARK PATTERNS
  // =========================================================================
  {
    id: 'finance_silent_autorenewal',
    title: 'Silent Subscription Auto-Renewal',
    category: 'financial_lockin',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(automatic(ally)?\s*renew(s|al)?|auto-renew(s|al)?|recurring\s*billing)\b/i,
      /\b(convert(ed|s)?\s*(in)?to\s*(a\s*)?(paid|full-price|regular)\s*(subscription|plan|membership))\b/i,
      /\b(without\s*(prior\s*)?notice|automatically\s*charged\s*unless\s*cancelled)\b/i,
      /\b(charged\s+the\s+full\s+(annual|monthly)\s+fee\s+automatically)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Free trial silently converts into an expensive recurring charge on your credit card without sending a reminder email.',
      accessibility:
        'If you forget to cancel before the trial ends, you will automatically be charged money every month or year.',
      privacy_pro:
        'Negative-option billing dark pattern converts evaluation periods into recurring liabilities without pre-charge transactional notifications.',
    },
    plainLanguageNote:
      'What happens: Silently charges your card after a free trial. Why it is unsafe: You may pay hundreds of dollars unexpectedly.',
    isToggleable: true,
    optOutClause: 'Cancel automatic recurring subscription renewals and provide at least 7 days email notice before any future billing.',
  },
  {
    id: 'finance_nonrefundable',
    title: 'Strict Non-Refundable Fee Forfeiture',
    category: 'financial_lockin',
    defaultSeverity: 'medium',
    baseWeight: 19,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(all\s*fees?\s*are\s*non-refundable|payments?\s*are\s*final\s*and\s*non-refundable)\b/i,
      /\b(no\s*refunds?\s*(or\s*credits?\s*)?(will\s*be\s*issued|provided|given))\b/i,
      /\b(forfeiture\s*of\s*(any\s*)?(prepaid\s*)?(fees?|balance|funds?))\b/i,
    ],
    harmByPersona: {
      everyday:
        'All purchases are strictly non-refundable, even if the service stops working or you cancel immediately after being charged.',
      accessibility:
        'You can never get your money back, even if the app breaks or does not work.',
      privacy_pro:
        'Disclaims all statutory cooling-off periods and refund recourse regardless of service outage or merchant non-performance.',
    },
    plainLanguageNote:
      'What happens: No refunds ever. Why it is unsafe: If the service is broken or charges you by mistake, you cannot get your money back.',
    isToggleable: true,
    optOutClause: 'Honor statutory consumer refund and charge-reversal rights in the event of service disruption or erroneous charges.',
  },
  {
    id: 'finance_autodebit_mandate',
    title: 'Irrevocable Auto-Debit & ACH Mandate',
    category: 'financial_lockin',
    defaultSeverity: 'high',
    baseWeight: 27,
    individualRiskFactor: 0.34,
    patterns: [
      /\b(auto-debit|ach\s*mandate|continuous\s*payment\s*authority)\b/i,
      /\b(direct\s*debit\s*from\s*(your\s*)?(bank\s*account|checking\s*account))\b/i,
      /\b(unilateral(ly)?\s*debit|recurring\s*withdrawal\s*without\s*further\s*consent)\b/i,
      /\b(authoriz(e|ing)\s+us\s+to\s+deduct\s+funds\s+directly)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Gives the company power to pull money directly out of your bank account without asking for your approval each time.',
      accessibility:
        'This allows the company to take money straight out of your bank account without checking with you first.',
      privacy_pro:
        'Broad recurring ACH direct-debit authorization without per-transaction confirmation or escrow safeguards.',
    },
    plainLanguageNote:
      'What happens: Can pull money directly from your bank account. Why it is unsafe: Can drain your balance without prior warning.',
    isToggleable: true,
    optOutClause: 'Revoke unilateral recurring bank account auto-debit authorizations and require manual per-charge confirmation.',
  },
  {
    id: 'finance_unilateral_price_change',
    title: 'Unilateral Price Increases Without Notice',
    category: 'financial_lockin',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.20,
    patterns: [
      /\b(change\s*(prices?|fees?|rates?|pricing)\s*(at\s*any\s*time)?\s*(without\s*(prior\s*)?notice))\b/i,
      /\b(reserve\s*the\s*right\s*to\s*modify\s*(our\s*)?(fees?|pricing|charges?)\s*at\s*sole\s*discretion)\b/i,
      /\b(price\s*increases?\s*shall\s*take\s*effect\s*immediately)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company can raise your subscription price at any time without telling you in advance, billing the higher rate on your next renewal.',
      accessibility:
        'They can make the service more expensive at any time without telling you beforehand.',
      privacy_pro:
        'Unilateral rate escalation clause eliminates price certainty and relies on passive user renewal to lock in price hikes.',
    },
    plainLanguageNote:
      'What happens: Can increase prices without telling you. Why it is unsafe: You might be charged a much higher price without agreeing.',
    isToggleable: true,
    optOutClause: 'Require advance written notice and affirmative consent before any fee increases apply to my account.',
  },
  {
    id: 'finance_difficult_cancellation',
    title: 'Dark Pattern Cancellation Obstacles',
    category: 'financial_lockin',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(cancellations?\s*require\s*(at\s*least\s*)?\d+\s*days?\s*(advance\s*)?notice)\b/i,
      /\b(must\s*call\s*(our\s*)?customer\s*service\s*to\s*cancel|cancel\s*only\s*by\s*phone)\b/i,
      /\b(cancellation\s*by\s*certified\s*mail|written\s*notice\s*received\s*\d+\s*days\s*prior)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Forces you through tedious obstacles to cancel—such as requiring 30 days advance notice, phone calls, or certified postal mail.',
      accessibility:
        'Cancelling your subscription is made very hard. You might have to call during work hours or send letters.',
      privacy_pro:
        'Asymmetric churn friction violates FTC Click-to-Cancel standards by establishing onerous hurdles for subscription termination.',
    },
    plainLanguageNote:
      'What happens: Makes it extremely hard to cancel. Why it is unsafe: You keep getting billed while trying to find a way to cancel.',
    isToggleable: true,
    optOutClause: 'Provide immediate, self-serve electronic cancellation through my account dashboard.',
  },

  // =========================================================================
  // CATEGORY 4: LEGAL RIGHTS & CONTENT OWNERSHIP
  // =========================================================================
  {
    id: 'legal_binding_arbitration',
    title: 'Forced Confidential Binding Arbitration',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 24,
    individualRiskFactor: 0.28,
    patterns: [
      /\b(binding\s*arbitration|mandatory\s*arbitration|arbitration\s*clause)\b/i,
      /\b(waive\s*(your\s*)?(right\s*to\s*)?(a\s*)?(jury\s*trial|go\s*to\s*court))\b/i,
      /\b(disputes?\s*(must|shall)\s*be\s*resolved\s*(exclusively\s*)?through\s*confidential\s*arbitration)\b/i,
    ],
    harmByPersona: {
      everyday:
        'You give up your right to sue the company in open court or before a jury if they leak your data or defraud you.',
      accessibility:
        'You agree you can never take this company to court or appear in front of a judge if they harm you.',
      privacy_pro:
        'Compulsory private arbitration strips public judicial oversight and eliminates legal precedent in consumer dispute adjudication.',
    },
    plainLanguageNote:
      'What happens: You cannot sue them in court. Why it is unsafe: If they leak your data, you cannot take them before a public judge.',
    isToggleable: true,
    optOutClause: 'I formally opt out of the mandatory binding arbitration provision as permitted within statutory deadlines.',
  },
  {
    id: 'legal_class_action_waiver',
    title: 'Class-Action Lawsuit Waiver',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 25,
    individualRiskFactor: 0.30,
    patterns: [
      /\b(class\s*action\s*waiver|waive\s*class\s*action)\b/i,
      /\b(no\s*class\s*(or\s*representative\s*)?(actions?|proceedings?|claims?))\b/i,
      /\b(only\s*bring\s*claims?\s*in\s*your\s*individual\s*capacity)\b/i,
      /\b(cannot\s*be\s*joined\s*or\s*consolidated\s*with\s*claims\s*of\s*any\s*other)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Prevents you from banding together with other affected customers in a group lawsuit if the company harms millions of users at once.',
      accessibility:
        'You cannot join with other people in a group lawsuit against this company.',
      privacy_pro:
        'Disables aggregate consumer collective redress, rendering individual low-value claims economically non-viable.',
    },
    plainLanguageNote:
      'What happens: You cannot join a class action. Why it is unsafe: If everyone loses $50, no single person can afford a solo lawsuit.',
    isToggleable: true,
    optOutClause: 'I reject the class action waiver clause and preserve all collective litigation and representative redress rights.',
  },
  {
    id: 'legal_perpetual_license',
    title: 'Perpetual & Irrevocable License Over User Content',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(perpetual,\s*irrevocable,\s*royalty-free|irrevocable,\s*perpetual\s*license)\b/i,
      /\b(transferable,\s*sub-?licensable,\s*worldwide\s*license)\b/i,
      /\b(use,\s*reproduce,\s*modify,\s*adapt,\s*publish,\s*translate,\s*create\s*derivative\s*works)\b/i,
      /\b(own(ership\s*of)?\s*(all\s*)?(content|materials?|uploads?|submissions?)\s*you\s*post)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company claims permanent ownership rights over files, photos, code, or documents you upload to their service forever.',
      accessibility:
        'Anything you upload (photos, files, text) becomes theirs to use forever without paying you.',
      privacy_pro:
        'Extravagant intellectual property assignment covenants transfer worldwide derivative commercial exploitation rights over private user uploads.',
    },
    plainLanguageNote:
      'What happens: They can use your uploads forever. Why it is unsafe: You lose control over your own photos, text, or files.',
    isToggleable: true,
    optOutClause: 'Revoke broad perpetual sub-licensing rights over all user-uploaded files, creative works, and proprietary documents.',
  },
  {
    id: 'legal_ai_training',
    title: 'Training AI Models on Private User Data & Prompts',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.33,
    patterns: [
      /\b(train(ing)?\s*[\w\s]{0,20}\b(ai|artificial\s*intelligence|machine\s*learning|llms?|neural\s*networks?|models?))\b/i,
      /\b(use\s*(your\s*)?(content|prompts?|inputs?|documents?|files?)\s*(to\s*)?(improve|develop|train)\s*(our\s*)?(ai|models?|services?))\b/i,
      /\b(machine\s*learning\s*model\s*development)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your uploaded files, private documents, code, or prompts are fed into AI models and can resurface in responses to other users.',
      accessibility:
        'Your private notes and files are used to teach computer AI models.',
      privacy_pro:
        'Commercial foundation model ingestion compromises proprietary trade secrets and exposes confidential corporate data through model inversion attacks.',
    },
    plainLanguageNote:
      'What happens: Uses your private data to train AI. Why it is unsafe: Your private notes could show up in answers to other users.',
    isToggleable: true,
    optOutClause: 'I withhold all consent for my prompts, code, files, and account communications to be ingested or used for AI/LLM model training.',
  },
  {
    id: 'legal_unilateral_terms_modification',
    title: 'Unilateral Terms Modification Without Notice',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 17,
    individualRiskFactor: 0.19,
    patterns: [
      /\b(modify|change|update|amend)\s+[\w\s]{0,20}\b(terms|agreement|policy)\s*(at\s*any\s*time)?\s*(without\s*(prior\s*)?notice)\b/i,
      /\b(continued\s*use\s*(of\s*the\s*service)?\s*constitutes?\s*acceptance\s*of\s*(any\s*)?changes)\b/i,
      /\b(your\s*responsibility\s*to\s*check\s*(this\s*page|these\s*terms)\s*periodically)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company can quietly change the terms or privacy rules whenever they want, and using the app means you automatically agree.',
      accessibility:
        'The rules can be changed at any time without telling you. If you keep using the app, you agree to the new rules.',
      privacy_pro:
        'Silent unilateral alteration clause bypasses notice requirements, placing the burden of contract change detection entirely on the consumer.',
    },
    plainLanguageNote:
      'What happens: Can change the contract quietly at any time. Why it is unsafe: You may agree to bad terms without ever seeing them.',
    isToggleable: true,
    optOutClause: 'Require explicit written notice via email before any material contractual modifications take effect.',
  },

  // =========================================================================
  // CATEGORY 5: RETENTION & SECURITY WEAKNESSES
  // =========================================================================
  {
    id: 'retention_indefinite',
    title: 'Indefinite Data Retention & Archival',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 24,
    individualRiskFactor: 0.29,
    patterns: [
      /\b(retain(ed)?\s*indefinitely|store(d)?\s*forever|kept\s*perpetually)\b/i,
      /\b(retain(ed)?\s*for\s*as\s*long\s*as\s*(we\s*deem\s*necessary|necessary\s*for\s*our\s*business\s*purposes))\b/i,
      /\b(no\s*defined\s*retention\s*period|indefinite\s*retention\s*period)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your personal records and account history are kept on their servers forever, with no expiration or cleanup date.',
      accessibility:
        'The company keeps your personal records forever and never deletes them.',
      privacy_pro:
        'Violation of GDPR Article 5(1)(e) storage limitation principles; preserves persistent behavioral data lakes indefinitely.',
    },
    plainLanguageNote:
      'What happens: Keeps your data forever. Why it is unsafe: Increases the chance that an old data breach leaks your history.',
    isToggleable: true,
    optOutClause: 'Apply strict data minimization and permanently scrub all records older than 12 months.',
  },
  {
    id: 'retention_post_deletion',
    title: 'Refusal to Erase Data After Account Deletion',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(retain(ed)?\s*(even\s*)?after\s*(account\s*)?(deletion|closure|termination))\b/i,
      /\b(deleting\s*(your\s*)?account\s*does\s*not\s*delete\s*(your\s*)?(data|information|records?))\b/i,
      /\b(we\s*will\s*continue\s*to\s*keep\s*your\s*records\s*after\s*you\s*close)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Even if you delete the app and cancel your account, the company keeps all your private records on file.',
      accessibility:
        'Even if you delete the app, they keep all your personal information on their computers.',
      privacy_pro:
        'Denial of GDPR Article 17 "Right to Erasure" and CCPA deletion mandates; retains identifiable user data post-termination.',
    },
    plainLanguageNote:
      'What happens: Keeps your info even if you delete your account. Why it is unsafe: You cannot make them forget you.',
    isToggleable: true,
    optOutClause: 'Fully erase all personal identifiers and records within 30 days upon account deletion per GDPR Art. 17.',
  },
  {
    id: 'security_lack_of_encryption',
    title: 'Lack of Encryption & Security Disclaimers',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 25,
    individualRiskFactor: 0.30,
    patterns: [
      /\b(transmitted\s*unencrypted|without\s*encryption|no\s*guarantee\s*of\s*security)\b/i,
      /\b(security\s*is\s*provided\s*["']as\s*is["']|use\s*at\s*your\s*own\s*risk\s*regarding\s*security)\b/i,
      /\b(we\s*cannot\s*ensure\s*or\s*warrant\s*the\s*security\s*of\s*any\s*information)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Transmits or stores your data without proper encryption, and disclaims responsibility if hackers steal your information.',
      accessibility:
        'Your private data is sent without safety locks. If hackers steal it, the company says it is your fault.',
      privacy_pro:
        'Absence of encryption in transit or at rest violates Article 32 GDPR requirements for appropriate technical and organizational safeguards.',
    },
    plainLanguageNote:
      'What happens: Does not promise to encrypt your data. Why it is unsafe: Hackers can intercept your messages and passwords.',
    isToggleable: true,
    optOutClause: 'Enforce AES-256 encryption at rest and TLS 1.3 in transit across all user data stores.',
  },
  {
    id: 'security_broad_disclosure',
    title: 'Broad Disclosure to Authorities Without Warrant',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 20,
    individualRiskFactor: 0.24,
    patterns: [
      /\b(disclose(d)?\s*to\s*(law\s*enforcement|government|authorities)\s*(without\s*(a\s*)?(warrant|subpoena|court\s*order)))\b/i,
      /\b(upon\s*informal\s*request\s*of\s*government\s*officials)\b/i,
      /\b(disclose\s*information\s*at\s*our\s*sole\s*discretion\s*to\s*any\s*governmental\s*agency)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company volunteers your private records to law enforcement upon informal request, without requiring a judicial search warrant or court subpoena.',
      accessibility:
        'The company can hand your private messages to the police without a judge signing a warrant.',
      privacy_pro:
        'Extralegal data disclosure policies surrender user privacy without requiring lawful process, subpoenas, or warrants.',
    },
    plainLanguageNote:
      'What happens: Gives your records to officials without a warrant. Why it is unsafe: Bypasses standard legal protections.',
    isToggleable: true,
    optOutClause: 'Strictly require a valid judicial warrant or court subpoena prior to disclosing any user telemetry.',
  },
];

/**
 * Checks if a sentence explicitly negates the clause (e.g. "We do not sell or share", "Zero tracking").
 */
export function isNegatedClause(sentence: string): boolean {
  const normalized = sentence.toLowerCase();

  // Explicit negation phrases
  if (
    /\b(do\s*not|does\s*not|will\s*not|never|no|zero|without|neither|nor|not\s*required|shall\s*not|is\s*not|are\s*not)\s+[\w\s]{0,35}\b(sell|share|rent|track|collect|record|transfer|require|access|charge|convert|disclose|retain|use|train|modify|mandate|arbitrate)\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /\b(we\s+do\s+not\s+(sell|rent|share|collect|store|access|monetize))\b/i.test(normalized) ||
    /\b(never\s+(sells?|rents?|shares?|collects?|records?|stores?|accesses?|monetizes?))\b/i.test(normalized) ||
    /\b(without\s+(your\s+)?(explicit|express|affirmative)?\s*(consent|permission|authorization))\b/i.test(normalized) ||
    /\b(zero\s+(tracking|logging|data\s+collection|ads))\b/i.test(normalized)
  ) {
    return true;
  }

  return false;
}

/**
 * Splits text into sentences and clause-level snippets.
 */
export function splitIntoClauses(text: string): string[] {
  // Split on sentence punctuation or double newlines or list semicolons
  return text
    .split(/(?<=[.!?\n;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 6);
}

/**
 * Extracts the exact matching sentence or snippet from the policy text.
 * Returns null if no actual sentence matches or if the sentence contains an active negation.
 */
export function extractGroundedSnippet(text: string, pattern: RegExp): string | null {
  const clauses = splitIntoClauses(text);

  for (const clause of clauses) {
    if (pattern.test(clause)) {
      if (isNegatedClause(clause)) {
        continue;
      }
      const trimmed = clause.trim();
      return trimmed.length > 240 ? trimmed.substring(0, 237) + '...' : trimmed;
    }
  }

  // Also test whole text in case pattern matches a short multi-line permission item like "READ_CONTACTS"
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  for (const line of lines) {
    if (pattern.test(line)) {
      if (isNegatedClause(line)) {
        continue;
      }
      return line.length > 240 ? line.substring(0, 237) + '...' : line;
    }
  }

  return null;
}

/**
 * Calculates raw risk score from active findings and configuration.
 * Cumulative probabilistic risk reduction model so each finding has a measurable, non-saturating impact.
 */
export function calculateDeepScore(
  findings: RiskItem[],
  persona: UserPersona = 'everyday',
  context: UsageContext = 'utility',
  tolerance: RiskTolerance = 'standard'
): { score: number; verdictSeverity: RiskSeverity } {
  const activeFindings = findings.filter((f) => !f.isSimulatedDisabled);

  if (activeFindings.length === 0) {
    return { score: 0, verdictSeverity: 'safe' };
  }

  let survivalProb = 1.0;

  for (const item of activeFindings) {
    let factor = Math.min(0.42, Math.max(0.12, item.weight / 75));

    if (tolerance === 'strict') {
      factor = Math.min(0.52, factor * 1.25);
    }

    if (persona === 'privacy_pro') {
      if (item.category === 'third_party_sharing' || item.category === 'retention_security') {
        factor = Math.min(0.52, factor * 1.2);
      }
    } else if (persona === 'accessibility') {
      if (item.category === 'financial_lockin') {
        factor = Math.min(0.52, factor * 1.2);
      }
    }

    survivalProb *= 1.0 - factor;
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
 * Builds custom opt-out and statutory data rights letter.
 */
export function buildDeepOptOutLetter(
  findings: RiskItem[],
  persona: UserPersona = 'everyday'
): string {
  const dateStr = new Date().toISOString().split('T')[0];

  if (findings.length === 0) {
    return `Subject: Privacy Confirmation & Data Minimization Acknowledgment

Date: ${dateStr}
To: Privacy & Legal Team

Hello,

I have reviewed your current terms and privacy notice. No opt-out or deletion request is required at this time as the provided terms follow standard data minimization principles.

Thank you.`;
  }

  // Collect specific active opt-out requests
  const activeItems = findings.filter((f) => !f.isSimulatedDisabled);
  const specificRequests: string[] = [];

  for (const f of activeItems) {
    const rule = DEEP_RULES.find((r) => r.id === f.id);
    if (rule?.optOutClause && !specificRequests.includes(rule.optOutClause)) {
      specificRequests.push(rule.optOutClause);
    }
  }

  if (persona === 'accessibility') {
    return `Subject: Please delete my personal information and stop sharing it

Date: ${dateStr}
To: Customer Support & Privacy Team

Hello,
I use your service, but I do not agree with some of the terms regarding my personal data.

Please do the following for my account:
${specificRequests.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

Please reply to confirm that you have made these changes to my account.

Thank you.`;
  }

  if (persona === 'privacy_pro') {
    return `FORMAL NOTICE OF DATA RIGHTS EXERCISE & RESTRICTION OF PROCESSING

Date: ${dateStr}
To: Data Protection Officer / Legal Privacy Team
Re: Exercise of Statutory Rights (GDPR Art. 17/18/21, CCPA/CPRA § 1798.120)

To Whom It May Concern:

I am writing as an active user of your platform to formally exercise my statutory rights regarding the processing, sharing, and retention of my personal and telemetry data:

${specificRequests.map((req, idx) => `${idx + 1}. ${req.toUpperCase()}`).join('\n')}

Please confirm compliance within statutory timeframes and provide written acknowledgment of implementation.

Sincerely,
Authorized Account Holder`;
  }

  // Everyday User
  return `Subject: Privacy Request: Opt-out of data sharing and terms review

Date: ${dateStr}
To: Privacy & Customer Support Team

Hi there,

I am writing regarding my account and the privacy settings for your service:

${specificRequests.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

Please confirm that these restrictions have been applied to my account records.

Regards,
Account User`;
}

/**
 * Builds specific actionable countermeasures from findings.
 */
export function buildDeepCountermeasures(
  findings: RiskItem[],
  persona: UserPersona = 'everyday'
): string[] {
  const steps: string[] = [];
  const activeItems = findings.filter((f) => !f.isSimulatedDisabled);

  for (const f of activeItems) {
    if (f.id === 'perm_contacts') {
      steps.push(
        persona === 'accessibility'
          ? 'Go to phone Settings > Apps > this app, and turn off Contacts access.'
          : 'Revoke Contacts permission in OS settings to prevent phonebook harvesting.'
      );
    } else if (f.id === 'perm_sms') {
      steps.push(
        persona === 'accessibility'
          ? 'Do not allow this app to read your SMS text messages. Type one-time bank codes yourself.'
          : 'Deny SMS permissions. Type bank verification codes manually instead of granting inbox access.'
      );
    } else if (f.id === 'perm_location') {
      steps.push(
        persona === 'accessibility'
          ? 'Change Location to "Only while using the app" or "Don\'t allow".'
          : 'Downgrade location permission to "Approximate" to prevent background tracking.'
      );
    } else if (f.id === 'finance_silent_autorenewal') {
      steps.push(
        persona === 'accessibility'
          ? 'Set a reminder on your calendar 3 days before the trial ends so you can cancel.'
          : 'Set a calendar reminder 5 days before renewal, or subscribe using a virtual card with a spending limit.'
      );
    } else if (f.id === 'finance_autodebit_mandate') {
      steps.push(
        persona === 'accessibility'
          ? 'Check your bank app and turn off any auto-pay mandates you did not want.'
          : 'Review your bank portal to revoke unilateral recurring debit mandates and set transaction limits.'
      );
    } else if (f.id === 'legal_ai_training') {
      steps.push(
        persona === 'accessibility'
          ? 'Do not upload private documents, tax files, or sensitive pictures to this app.'
          : 'Submit an opt-out request forbidding commercial AI model training on your uploaded files.'
      );
    } else if (f.id === 'share_sell_rent' || f.id === 'share_debt_brokers') {
      steps.push(
        persona === 'accessibility'
          ? 'Copy the email below and send it to their support team asking them not to sell your data.'
          : 'Submit a formal opt-out request citing consumer data rights to restrict data sales.'
      );
    }
  }

  if (steps.length === 0) {
    steps.push(
      persona === 'accessibility'
        ? 'No special action needed. The provided terms respect basic privacy boundaries.'
        : 'Standard hygiene: review permissions periodically and install only from verified app stores.'
    );
  }

  // Deduplicate steps
  return Array.from(new Set(steps));
}

/**
 * Builds the executive verdict based on severity and findings.
 */
export function buildDeepExecutiveVerdict(
  severity: RiskSeverity,
  score: number,
  findingsCount: number,
  persona: UserPersona = 'everyday'
): string {
  if (severity === 'safe' || score < 20 || findingsCount === 0) {
    switch (persona) {
      case 'accessibility':
        return 'Good news: No major red flags were found in this agreement. It does not ask for dangerous permissions or contain hidden charges.';
      case 'privacy_pro':
        return 'Minimal threat surface detected. The provided text respects data minimization and lacks predatory tracking or indefinite retention covenants.';
      case 'everyday':
      default:
        return 'No major red flags were found in the provided text. The terms appear transparent and request only standard, scoped permissions.';
    }
  }

  if (severity === 'high' || score >= 68) {
    switch (persona) {
      case 'accessibility':
        return `Danger: We found ${findingsCount} serious risks. This app asks for private access it does not need and can share your information. Turn off dangerous permissions before using it.`;
      case 'privacy_pro':
        return `Critical risk posture (${score}/100). The agreement exhibits severe surveillance clauses, third-party brokering, and forced legal waivers that violate standard user privacy rights.`;
      case 'everyday':
      default:
        return `High risk alert (${score}/100). This agreement contains predatory terms including aggressive personal data access and potential financial lock-ins. We recommend rejecting optional permissions.`;
    }
  }

  // Medium / Low
  switch (persona) {
    case 'accessibility':
      return `Caution: We found ${findingsCount} items you should know about. Some charges or permissions may happen automatically if you do not cancel in time.`;
    case 'privacy_pro':
      return `Moderate exposure profile (${score}/100). Identifies vendor-friendly terms including third-party telemetry, subscription renewal defaults, and legal limitations.`;
    case 'everyday':
    default:
      return `Moderate risk detected (${score}/100). While typical for commercial apps, these terms include auto-renewal mechanisms and marketing telemetry that require your attention.`;
  }
}

/**
 * Deep Deterministic Clause & Permission Analyzer.
 *
 * Strict Zero-Hallucination Guarantee:
 * ONLY produces findings when an exact, grounded, non-negated sentence
 * or permission snippet is present in the actual input text.
 */
export function analyzeDeeply(
  policyText: string,
  persona: UserPersona = 'everyday',
  context: UsageContext = 'utility',
  tolerance: RiskTolerance = 'standard'
): AnalysisResult {
  const matchedFindings: RiskItem[] = [];
  const permissionAnomalies: string[] = [];

  for (const rule of DEEP_RULES) {
    let matchedSnippet: string | null = null;

    for (const pattern of rule.patterns) {
      const snippet = extractGroundedSnippet(policyText, pattern);
      if (snippet) {
        matchedSnippet = snippet;
        break;
      }
    }

    // STRICT ZERO-HALLUCINATION GUARD:
    // If no verifiable, grounded snippet matching the rule exists in the text, DO NOT flag it!
    if (!matchedSnippet) {
      continue;
    }

    // Check for category permission anomalies (e.g. contacts in a utility or finance app)
    if (
      (context === 'utility' || context === 'finance' || context === 'health') &&
      (rule.id === 'perm_contacts' || rule.id === 'perm_sms' || rule.id === 'perm_audio')
    ) {
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
  const { score, verdictSeverity } = calculateDeepScore(matchedFindings, persona, context, tolerance);

  const executiveVerdict = buildDeepExecutiveVerdict(
    verdictSeverity,
    score,
    matchedFindings.length,
    persona
  );

  const countermeasures = buildDeepCountermeasures(matchedFindings, persona);
  const optOutDraft = buildDeepOptOutLetter(matchedFindings, persona);

  return {
    score,
    verdictSeverity,
    executiveVerdict,
    findings: matchedFindings,
    permissionAnomalies,
    countermeasures,
    optOutDraft,
    engineUsed: 'Deep Rule Engine',
    analyzedAt: new Date().toISOString(),
  };
}
