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
  baseWeight: number; // 10 to 30
  individualRiskFactor: number; // 0.12 to 0.36
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
        'The app requests access to your device address book or full contact list, which can expose personal phone numbers and names of people you know.',
      accessibility:
        'This app asks to see and copy the names and phone numbers stored in your contacts.',
      privacy_pro:
        'Harvests the device contact graph and phonebook metadata, creating relational exposure for non-consenting third parties.',
    },
    plainLanguageNote:
      'What happens: Asks to read your contacts. Practical impact: Exposes contact names and numbers; you can deny or revoke this permission in device settings.',
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
        'The app requests permission to read or intercept your SMS text messages, which can include two-factor verification codes and private messages.',
      accessibility:
        'This app asks to read your personal text messages and SMS codes.',
      privacy_pro:
        'Direct access to SMS message streams bypasses out-of-band two-factor authentication safeguards and exposes private message contents.',
    },
    plainLanguageNote:
      'What happens: Accesses text messages. Practical impact: Can read verification codes; enter one-time codes manually rather than granting inbox access.',
    isToggleable: true,
    optOutClause: 'Immediately cease parsing transactional or personal SMS messages and erase all intercepted inbox content.',
  },
  {
    id: 'perm_location',
    title: 'Persistent Background GPS Tracking',
    category: 'data_collection',
    defaultSeverity: 'high',
    baseWeight: 24,
    individualRiskFactor: 0.28,
    patterns: [
      /\b(access_fine_location|access_background_location)\b/i,
      /\b(precise\s*(gps|geographic|geolocation|location)\s*(data|coordinates?|tracking))\b/i,
      /\b(continuous(ly)?|persistent(ly)?|background)\s+[\w\s]{0,20}\b(track(ing)?|monitor(ing)?|record(ing)?)\s+[\w\s]{0,15}\b(location|gps|movement)\b/i,
      /\b(exact\s*physical\s*location\s*at\s*all\s*times)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Continuously tracks your precise real-time physical GPS coordinates in the background, revealing daily travel patterns and visited locations.',
      accessibility:
        'This app tracks your exact location even when you are not actively using it.',
      privacy_pro:
        'Continuous high-resolution geolocation tracking generates persistent spatial lifestyle profiles and sensitive destination histories.',
    },
    plainLanguageNote:
      'What happens: Tracks exact background location. Practical impact: Set location permission to "Only while using app" or "Approximate" in system settings.',
    isToggleable: true,
    optOutClause: 'Disable persistent geolocation tracking and purge all historical GPS coordinate breadcrumbs.',
  },
  {
    id: 'perm_audio',
    title: 'Microphone & Audio Recording',
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
        'Requests access to your device microphone to record audio, voice input, or ambient sound.',
      accessibility:
        'This app can access your microphone to listen to or record sound.',
      privacy_pro:
        'Acoustic monitoring and microphone access privileges permit ambient audio capture without real-time active indicators.',
    },
    plainLanguageNote:
      'What happens: Accesses the microphone. Practical impact: Allows recording voice or room sound; grant access only when actively speaking.',
    isToggleable: true,
    optOutClause: 'Revoke microphone recording permissions and permanently delete all stored voice or ambient audio files.',
  },
  {
    id: 'perm_camera',
    title: 'Broad Camera Access',
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
        'Requests camera access to capture photographs or video streams through your device.',
      accessibility:
        'This app can use your phone camera to take pictures or video.',
      privacy_pro:
        'Broad camera permissions allow optical capture of your physical surroundings.',
    },
    plainLanguageNote:
      'What happens: Accesses your camera. Practical impact: Allows taking photos or video; restrict to "While using app" in settings.',
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
        'Logs keystroke timing or text input as you type, which can capture passwords or unsubmitted drafts.',
      accessibility:
        'This app records what you type on your keyboard.',
      privacy_pro:
        'Keystroke interception and typing telemetry captures unsubmitted input and credential data.',
    },
    plainLanguageNote:
      'What happens: Records typed input. Practical impact: Can log sensitive entries; avoid using third-party keyboards for passwords.',
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
        'Collects permanent biometric identifiers such as facial recognition scans or fingerprint templates.',
      accessibility:
        'This app collects your facial scan or fingerprints and stores them.',
      privacy_pro:
        'Biometric template retention creates immutable identity compromise risk under statutory frameworks like BIPA and GDPR Art. 9.',
    },
    plainLanguageNote:
      'What happens: Collects biometric data. Practical impact: Biometrics cannot be reset if breached; review biometric consent options.',
    isToggleable: true,
    optOutClause: 'Destroy all stored biometric templates, faceprints, and fingerprint records per BIPA guidelines.',
  },
  {
    id: 'perm_device_fingerprint',
    title: 'Hardware Device Fingerprinting',
    category: 'data_collection',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(device\s*fingerprint(ing)?|canvas\s*fingerprint(ing)?|hardware\s*serial\s*number|imei\s*(number)?|mac\s*address)\b/i,
      /\b(installed\s*(applications?|apps|packages?)\s*(list|inventory))\b/i,
      /\b(query_all_packages|get_installed_apps)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Creates a persistent hardware profile using serial numbers, MAC addresses, or installed application inventories to identify your device across sessions.',
      accessibility:
        'This app records your device hardware identifiers and checks what other apps you have installed.',
      privacy_pro:
        'Hardware identifiers and package inventory queries resist standard advertising ID resets and cookie clearing.',
    },
    plainLanguageNote:
      'What happens: Identifies your hardware device. Practical impact: Enables cross-session tracking; reset advertising identifiers periodically.',
    isToggleable: true,
    optOutClause: 'Cease enumerating installed package lists and purge device fingerprinting identifiers.',
  },
  {
    id: 'perm_call_logs',
    title: 'Call History & Telephony Logging',
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
        'Monitors your incoming and outgoing call records, including phone numbers, timestamps, and call durations.',
      accessibility:
        'This app reads your phone call history to see who you called and when.',
      privacy_pro:
        'Exfiltrates telephony metadata revealing calling frequency, duration, and communication graphs.',
    },
    plainLanguageNote:
      'What happens: Accesses call history. Practical impact: Tracks who you speak with; deny call log permissions in system settings.',
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
      /\b(we\s+(may\s+)?(sell|rent|lease|monetize)\s+[\w\s]{0,20}\b(personal\s*(data|information)|user\s*data|consumer\s*records?))\b/i,
      /\b(sell(ing)?|rent(ing)?)\s+(your\s+)?(personal\s*(data|information)|email\s*addresses?)\s+to\s+third\s*parties\b/i,
      /\b(share\s+(your\s+)?(personal\s*data|information)\s+for\s+(monetary|financial)\s+(consideration|compensation))\b/i,
      /\b(data\s*may\s*be\s*sold\s*or\s*rented)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The agreement explicitly permits selling or renting your personal data or contact records to third parties for commercial value.',
      accessibility:
        'This company can sell or rent your personal information to other businesses for money.',
      privacy_pro:
        'Explicit commercialization and sale of user datasets under CCPA § 1798.120 and statutory privacy frameworks.',
    },
    plainLanguageNote:
      'What happens: Sells your data to external parties. Practical impact: Submit a formal "Do Not Sell My Information" opt-out request.',
    isToggleable: true,
    optOutClause: 'I exercise my right to opt out of the sale or rental of all my personal data per statutory privacy laws.',
  },
  {
    id: 'share_marketing_partners',
    title: 'Sharing with Third Parties for Direct Marketing',
    category: 'third_party_sharing',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(share(d)?\s+with|disclose(d)?\s+to)\s+[\w\s]{0,25}\b(marketing\s*partners?|advertising\s*affiliates?|commercial\s*sponsors?)\s+(for\s+(their\s*)?(own\s*)?(direct\s*)?marketing)\b/i,
      /\b(promotional\s*partners?\s*for\s*(their\s*own\s*)?direct\s*marketing)\b/i,
      /\b(third\s*party\s*marketers?\s*and\s*advertisers\s*for\s*(their\s*)?promotional\s*purposes)\b/i,
      /\b(unaffiliated\s*third\s*parties\s*for\s*(their\s*)?(own\s*)?marketing)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Allows sharing your contact details or profile with commercial partners so they can send you independent promotional offers.',
      accessibility:
        'This company can share your contact info with promotional partners who want to send you offers.',
      privacy_pro:
        'Permits sharing personal identifiers with third parties for independent commercial marketing and lead generation.',
    },
    plainLanguageNote:
      'What happens: Shares details with marketing partners. Practical impact: May increase promotional contacts; opt out via communication preferences.',
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
      /\b(share\s*with|disclose\s*to|transfer\s*to)\s+[\w\s]{0,25}\b(debt\s*collectors?|credit\s*reporting\s*agenc(y|ies)|data\s*aggregators?)\b/i,
      /\b(for\s*the\s*purpose\s*of\s*debt\s*recovery\s*or\s*credit\s*assessment)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Allows transferring account history and contact records to commercial data brokers or debt collection agencies.',
      accessibility:
        'This company can hand your records over to collection agencies or commercial data brokers.',
      privacy_pro:
        'Syndicates user records to credit reporting agencies and data brokers, creating secondary offline tracking and collection exposure.',
    },
    plainLanguageNote:
      'What happens: Distributes info to brokers or collection agencies. Practical impact: Can affect credit records; request data broker removal.',
    isToggleable: true,
    optOutClause: 'Immediately cease syndicating or distributing my contact and account records to debt recovery affiliates or data brokers.',
  },
  {
    id: 'share_ad_tracking',
    title: 'Cross-Context Targeted Advertising',
    category: 'third_party_sharing',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(cross-context\s*behavioral\s*advertising|targeted\s*advertis(ing|ements?)|interest-based\s*ads?)\b/i,
      /\b(track(ing)?\s*(your\s*)?activity\s*across\s*(other\s*)?(unaffiliated\s*)?(websites|apps|platforms))\b/i,
      /\b(create\s*a\s*commercial\s*profile|behavioral\s*profiling\s*for\s*ads?)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Shares browsing and usage activity with advertising networks to show personalized, interest-based ads across different websites.',
      accessibility:
        'Advertising companies track what you view across websites so they can display targeted advertisements.',
      privacy_pro:
        'Transmits behavioral telemetry and advertising identifiers to ad networks for cross-site profile building and real-time bidding.',
    },
    plainLanguageNote:
      'What happens: Tracks activity across the web for ad targeting. Practical impact: Reduces online anonymity; opt out via cookie or ad-tracking settings.',
    isToggleable: true,
    optOutClause: 'I opt out of all cross-context behavioral advertising and commercial profiling activities.',
  },
  {
    id: 'share_ad_sdks',
    title: 'Third-Party Analytics & Tracking SDKs',
    category: 'third_party_sharing',
    defaultSeverity: 'low',
    baseWeight: 10,
    individualRiskFactor: 0.12,
    patterns: [
      /\b(third[\s-]party\s*(sdks?|measurement\s*sdks?|software\s*development\s*kits?|trackers?|pixels?|web\s*beacons?))\b/i,
      /\b((analytics|measurement)\s*(and\s*(measurement|analytics)\s*)?(sdks?|libraries|partners?|tools?))\b/i,
      /\b(third[\s-]party\s*cookies(\s*and\s*(similar\s*)?tracking\s*technologies)?)\b/i,
      /\b(cookies\s*and\s*(third[\s-]party\s*)?(measurement|tracking|analytics)\s*(technologies|sdks?|tools?))\b/i,
    ],
    harmByPersona: {
      everyday:
        'Uses third-party analytics and measurement tools to monitor website performance, feature usage, and traffic trends.',
      accessibility:
        'Third-party measurement tools run inside the app to understand how people use it.',
      privacy_pro:
        'Embedded third-party libraries and cookies transmit technical session telemetry and diagnostics to analytics providers.',
    },
    plainLanguageNote:
      'What happens: Uses third-party analytics tools. Practical impact: Standard for monitoring app performance; manage via browser cookie controls.',
    isToggleable: true,
    optOutClause: 'Block all third-party tracking pixels and ad network telemetry associated with this user ID.',
  },

  // =========================================================================
  // CATEGORY 3: FINANCIAL TRAPS & DARK PATTERNS
  // =========================================================================
  {
    id: 'finance_silent_autorenewal',
    title: 'Automatic Subscription Renewal',
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
        'Free trials or memberships automatically renew into ongoing recurring billing unless actively cancelled before the renewal date.',
      accessibility:
        'Your subscription will keep charging you money automatically every month or year until you cancel.',
      privacy_pro:
        'Negative-option billing covenants convert trials into recurring financial liabilities without affirmative renewal re-authorization.',
    },
    plainLanguageNote:
      'What happens: Automatically renews subscription charges. Practical impact: Set a calendar reminder before the trial ends to decide whether to cancel.',
    isToggleable: true,
    optOutClause: 'Cancel automatic recurring subscription renewals and provide at least 7 days email notice before any future billing.',
  },
  {
    id: 'finance_nonrefundable',
    title: 'Non-Refundable Fee Policy',
    category: 'financial_lockin',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(all\s*fees?\s*are\s*non-refundable|payments?\s*are\s*final\s*and\s*non-refundable)\b/i,
      /\b(no\s*refunds?\s*(or\s*credits?\s*)?(will\s*be\s*issued|provided|given))\b/i,
      /\b(forfeiture\s*of\s*(any\s*)?(prepaid\s*)?(fees?|balance|funds?))\b/i,
    ],
    harmByPersona: {
      everyday:
        'States that fees and subscription payments are final and non-refundable once processed.',
      accessibility:
        'Payments cannot be refunded once charged, even if you stop using the service.',
      privacy_pro:
        'Disclaims standard refund recourse and cooling-off cancellation rights post-transaction.',
    },
    plainLanguageNote:
      'What happens: Fees are non-refundable. Practical impact: Try a free tier or monthly billing before committing to long prepaid terms.',
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
        'Authorizes recurring direct debits straight from your bank account without requiring per-transaction approvals.',
      accessibility:
        'Allows the company to take money directly from your bank account on a recurring schedule.',
      privacy_pro:
        'Direct ACH debit authorization permits automated bank account withdrawals without per-charge affirmative authorization.',
    },
    plainLanguageNote:
      'What happens: Debits your bank account directly. Practical impact: Check your bank portal to review or revoke recurring debit mandates.',
    isToggleable: true,
    optOutClause: 'Revoke unilateral recurring bank account auto-debit authorizations and require manual per-charge confirmation.',
  },
  {
    id: 'finance_unilateral_price_change',
    title: 'Price Changes Without Advance Notice',
    category: 'financial_lockin',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(change\s*(prices?|fees?|rates?|pricing)\s*(at\s*any\s*time)?\s*(without\s*(prior\s*)?notice))\b/i,
      /\b(reserve\s*the\s*right\s*to\s*modify\s*(our\s*)?(fees?|pricing|charges?)\s*at\s*sole\s*discretion\s*without\s*notice)\b/i,
      /\b(price\s*increases?\s*shall\s*take\s*effect\s*immediately)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company reserves the ability to adjust subscription rates or fees without providing advance notice before your next bill.',
      accessibility:
        'The service can raise prices at any time without telling you beforehand.',
      privacy_pro:
        'Unilateral rate modification without mandated advance notice periods weakens price predictability.',
    },
    plainLanguageNote:
      'What happens: Can change pricing without advance notice. Practical impact: Monitor monthly billing statements for rate adjustments.',
    isToggleable: true,
    optOutClause: 'Require advance written notice and affirmative consent before any fee increases apply to my account.',
  },
  {
    id: 'finance_difficult_cancellation',
    title: 'Onerous Cancellation Procedures',
    category: 'financial_lockin',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(cancellations?\s*require\s*(at\s*least\s*)?\d+\s*days?\s*(advance\s*)?notice)\b/i,
      /\b(must\s*call\s*(our\s*)?customer\s*service\s*to\s*cancel|cancel\s*only\s*by\s*phone)\b/i,
      /\b(cancellation\s*by\s*certified\s*mail|written\s*notice\s*received\s*\d+\s*days\s*prior)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Requires advance notice periods (such as 30 days) or offline channels (phone calls or certified mail) to cancel recurring subscriptions.',
      accessibility:
        'Cancelling requires extra steps like making phone calls or sending letters well before your billing date.',
      privacy_pro:
        'Onerous cancellation friction creates obstacles to subscription termination in contrast to self-serve instant cancellation standards.',
    },
    plainLanguageNote:
      'What happens: Requires complex cancellation steps. Practical impact: Initiate cancellation well ahead of any mandatory advance notice window.',
    isToggleable: true,
    optOutClause: 'Provide immediate, self-serve electronic cancellation through my account dashboard.',
  },

  // =========================================================================
  // CATEGORY 4: LEGAL RIGHTS & CONTENT OWNERSHIP
  // =========================================================================
  {
    id: 'legal_binding_arbitration',
    title: 'Mandatory Binding Arbitration',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(binding\s*arbitration|mandatory\s*arbitration|arbitration\s*clause)\b/i,
      /\b(waive\s*(your\s*)?(right\s*to\s*)?(a\s*)?(jury\s*trial|go\s*to\s*court))\b/i,
      /\b(disputes?\s*(must|shall)\s*be\s*resolved\s*(exclusively\s*)?through\s*confidential\s*arbitration)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Requires resolving legal disputes through private arbitration rather than a public court or jury trial. Practical impact: Limits formal court litigation options, though individual arbitration remains available.',
      accessibility:
        'If a serious legal dispute happens, it must be handled by a private arbitrator rather than a judge in court.',
      privacy_pro:
        'Compulsory binding arbitration replaces judicial forums and statutory jury trials with private dispute resolution mechanisms.',
    },
    plainLanguageNote:
      'What happens: Disputes go to private arbitration rather than court. Practical impact: Limits court lawsuits; check if the agreement offers an opt-out window (usually 30 days).',
    isToggleable: true,
    optOutClause: 'I formally opt out of the mandatory binding arbitration provision as permitted within statutory deadlines.',
  },
  {
    id: 'legal_class_action_waiver',
    title: 'Class-Action Lawsuit Waiver',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(class\s*action\s*waiver|waive\s*class\s*action)\b/i,
      /\b(no\s*class\s*(or\s*representative\s*)?(actions?|proceedings?|claims?))\b/i,
      /\b(only\s*bring\s*claims?\s*in\s*your\s*individual\s*capacity)\b/i,
      /\b(cannot\s*be\s*joined\s*or\s*consolidated\s*with\s*claims\s*of\s*any\s*other)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Requires resolving claims strictly on an individual basis and waives the right to participate in group or class-action lawsuits.',
      accessibility:
        'You agree to handle any legal dispute individually and cannot join group lawsuits with other customers.',
      privacy_pro:
        'Class-action waiver limits dispute aggregation, requiring individualized claims regardless of widespread common impact.',
    },
    plainLanguageNote:
      'What happens: Waives class-action participation. Practical impact: Requires individual claims rather than joining collective consumer lawsuits.',
    isToggleable: true,
    optOutClause: 'I reject the class action waiver clause and preserve all collective litigation and representative redress rights.',
  },
  {
    id: 'legal_perpetual_license',
    title: 'Perpetual License Over Uploaded Content',
    category: 'retention_security',
    defaultSeverity: 'high',
    baseWeight: 26,
    individualRiskFactor: 0.32,
    patterns: [
      /\b(perpetual,\s*irrevocable,\s*royalty-free|irrevocable,\s*perpetual\s*license)\b/i,
      /\b(transferable,\s*sub-?licensable,\s*worldwide\s*license)\b/i,
      /\b(own(ership\s*of)?\s*(all\s*)?(content|materials?|uploads?|submissions?)\s*you\s*post)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Grants the service an irrevocable, perpetual, royalty-free worldwide license to use, adapt, or distribute your uploaded files or content.',
      accessibility:
        'Anything you upload can be used and distributed by the company forever without paying you.',
      privacy_pro:
        'Broad intellectual property assignment and perpetual sub-licensing covenants transfer durable commercial rights over private user uploads.',
    },
    plainLanguageNote:
      'What happens: Grants broad perpetual rights over your uploads. Practical impact: Avoid uploading sensitive or proprietary creative works.',
    isToggleable: true,
    optOutClause: 'Revoke broad perpetual sub-licensing rights over all user-uploaded files, creative works, and proprietary documents.',
  },
  {
    id: 'legal_ai_training',
    title: 'Using User Data to Train AI Models',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(train(ing)?\s*[\w\s]{0,20}\b(ai|artificial\s*intelligence|machine\s*learning|llms?|neural\s*networks?|models?))\b/i,
      /\b(use\s*(your\s*)?(content|prompts?|inputs?|documents?|files?)\s*(to\s*)?(improve|develop|train)\s*(our\s*)?(ai|models?|services?))\b/i,
      /\b(machine\s*learning\s*model\s*development)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Your prompts, inputs, or uploaded content may be used to train or refine artificial intelligence and machine learning models.',
      accessibility:
        'Your messages, notes, and files may be used to train computer AI models. Do not submit private secrets or sensitive info.',
      privacy_pro:
        'Permits ingestion of user prompts, inputs, and documents for model development and fine-tuning unless enterprise zero-data-retention terms apply.',
    },
    plainLanguageNote:
      'What happens: User inputs help train AI systems. Practical impact: Avoid sharing confidential details unless AI model training is opted out in account settings.',
    isToggleable: true,
    optOutClause: 'I withhold all consent for my prompts, code, files, and account communications to be ingested or used for AI/LLM model training.',
  },
  {
    id: 'legal_unilateral_terms_modification',
    title: 'Terms Updates & Modifications',
    category: 'retention_security',
    defaultSeverity: 'low',
    baseWeight: 10,
    individualRiskFactor: 0.12,
    patterns: [
      /\b(modify|change|update|amend)\s+[\w\s]{0,20}\b(terms|agreement|policy)\s*(at\s*any\s*time)?\s*(without\s*(prior\s*)?notice)\b/i,
      /\b(continued\s*use\s*(of\s*the\s*service)?\s*constitutes?\s*acceptance\s*of\s*(any\s*)?changes)\b/i,
      /\b(your\s*responsibility\s*to\s*check\s*(this\s*page|these\s*terms)\s*periodically)\b/i,
    ],
    harmByPersona: {
      everyday:
        'The company may update its terms or privacy policy over time, treating continued use of the service as acceptance of the updated terms.',
      accessibility:
        'The company can update the rules over time. If you continue using the app, you agree to the new terms.',
      privacy_pro:
        'Standard terms alteration mechanism where continued platform utilization constitutes implied acceptance of revised covenants.',
    },
    plainLanguageNote:
      'What happens: Policy terms can be updated periodically. Practical impact: Review email update notices when sent.',
    isToggleable: true,
    optOutClause: 'Require explicit written notice via email before any material contractual modifications take effect.',
  },

  // =========================================================================
  // CATEGORY 5: RETENTION & SECURITY WEAKNESSES
  // =========================================================================
  {
    id: 'retention_indefinite',
    title: 'Indefinite Data Retention',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(retain(ed)?\s*indefinitely|store(d)?\s*forever|kept\s*perpetually)\b/i,
      /\b(no\s*defined\s*retention\s*period|indefinite\s*retention\s*period)\b/i,
      /\b(retain(ed)?\s*for\s*as\s*long\s*as\s*(we\s*deem\s*necessary|necessary\s*for\s*our\s*business\s*purposes))\b/i,
    ],
    harmByPersona: {
      everyday:
        'Personal records are stored for ongoing business or compliance periods without a fixed automatic expiration date.',
      accessibility:
        'The company keeps your account information for its business records until you ask them to delete it.',
      privacy_pro:
        'Flexible retention windows maintain account records for ongoing business and compliance needs rather than enforcing strict automated expiration cycles.',
    },
    plainLanguageNote:
      'What happens: Records are retained for business needs. Practical impact: Request account data deletion when you stop using the service.',
    isToggleable: true,
    optOutClause: 'Apply strict data minimization and permanently scrub all records older than 12 months.',
  },
  {
    id: 'retention_post_deletion',
    title: 'Post-Account Deletion Record Archival',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 12,
    individualRiskFactor: 0.16,
    patterns: [
      /\b(retain(ed)?\s*(even\s*)?after\s*(account\s*)?(deletion|closure|termination))\b/i,
      /\b(deleting\s*(your\s*)?account\s*does\s*not\s*delete\s*(your\s*)?(data|information|records?))\b/i,
      /\b(we\s*will\s*continue\s*to\s*keep\s*your\s*records\s*after\s*you\s*close)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Certain transaction, security, or audit records may remain archived even after account deletion where required for legal and financial compliance.',
      accessibility:
        'Some records may stay in company archives for legal and safety rules even after you close your account.',
      privacy_pro:
        'Maintains post-termination archival records for statutory compliance, dispute resolution, and security auditing.',
    },
    plainLanguageNote:
      'What happens: Archives compliance logs after account closure. Practical impact: Normal for tax and fraud prevention; submit a data erasure request if needed.',
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
        'Transmits or stores information without guaranteed encryption, and disclaims liability if security breaches or unauthorized access occur.',
      accessibility:
        'The service does not promise to encrypt your data and disclaims responsibility if data is intercepted.',
      privacy_pro:
        'Disclaims standard encryption warranties and liability for data in transit and at rest.',
    },
    plainLanguageNote:
      'What happens: Disclaims security guarantees. Practical impact: Avoid transmitting sensitive financial or personal data.',
    isToggleable: true,
    optOutClause: 'Enforce AES-256 encryption at rest and TLS 1.3 in transit across all user data stores.',
  },
  {
    id: 'security_broad_disclosure',
    title: 'Broad Disclosure to Authorities Without Warrant',
    category: 'retention_security',
    defaultSeverity: 'medium',
    baseWeight: 18,
    individualRiskFactor: 0.22,
    patterns: [
      /\b(disclose(d)?\s*to\s*(law\s*enforcement|government|authorities)\s*(without\s*(a\s*)?(warrant|subpoena|court\s*order)))\b/i,
      /\b(upon\s*informal\s*request\s*of\s*government\s*officials)\b/i,
      /\b(disclose\s*information\s*at\s*our\s*sole\s*discretion\s*to\s*any\s*governmental\s*agency)\b/i,
    ],
    harmByPersona: {
      everyday:
        'Allows voluntary disclosure of user records to law enforcement upon informal request, without requiring a formal subpoena or judicial warrant.',
      accessibility:
        'The company can share your records with government officials without requiring a court warrant.',
      privacy_pro:
        'Voluntary government disclosure policies bypass standard statutory subpoena and warrant requirements.',
    },
    plainLanguageNote:
      'What happens: Can disclose records to officials without a court warrant. Practical impact: Standard legal protections are waived.',
    isToggleable: true,
    optOutClause: 'Strictly require a valid judicial warrant or court subpoena prior to disclosing any user telemetry.',
  },
];

/**
 * Checks if a sentence explicitly negates the clause or outlines an opt-out right.
 * (e.g. "We do not sell or share", "Zero tracking", "You may opt out at any time").
 */
export function isNegatedClause(sentence: string): boolean {
  const normalized = sentence.toLowerCase().trim();

  // 1. Explicit Negation Phrases
  if (
    /\b(do\s*not|does\s*not|will\s*not|never|no|zero|without|neither|nor|not\s*required|shall\s*not|is\s*not|are\s*not|have\s*not)\s+[\w\s]{0,35}\b(sell|share|rent|track|collect|record|transfer|require|access|charge|convert|disclose|retain|use|train|modify|mandate|arbitrate|monetize)\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  // 2. Clear Subject Negations & Explicit Non-Sales
  if (
    /\b(we\s+do\s+not\s+(sell|rent|share|collect|store|access|monetize|track|use|disclose))\b/i.test(normalized) ||
    /\b(never\s+(sells?|rents?|shares?|collects?|records?|stores?|accesses?|monetizes?|tracks?))\b/i.test(normalized) ||
    /\b(without\s+(your\s+)?(explicit|express|affirmative)?\s*(consent|permission|authorization|prior\s*approval))\b/i.test(normalized) ||
    /\b(zero\s+(tracking|logging|data\s+collection|ads))\b/i.test(normalized) ||
    /\b(not\s+(in\s+the\s+business\s+of\s+selling|sold\s+or\s+rented))\b/i.test(normalized) ||
    /\b(we\s+(have\s+not|do\s+not)\s+sold\s+any\s+personal)\b/i.test(normalized)
  ) {
    return true;
  }

  // 3. Opt-out Rights & Statutory CCPA / GDPR Notices
  if (
    /\b(you\s+(can|may|have\s+the\s+right\s+to)\s+opt[\s-]out)\b/i.test(normalized) ||
    /\b(opt[\s-]out\s+at\s+any\s+time)\b/i.test(normalized) ||
    /\b(right\s+to\s+opt[\s-]out\s+of\s+(the\s+)?(sale|sharing|targeted))\b/i.test(normalized) ||
    /\b(do\s+not\s+sell\s+or\s+share\s+my\s+personal)\b/i.test(normalized) ||
    /\b(instructions?\s+on\s+how\s+to\s+opt[\s-]out)\b/i.test(normalized)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a clause is describing routine operational processing by service providers,
 * payment processors, hosting vendors, or legal compliance, which should NOT be flagged
 * as predatory third-party data selling, syndication, or broker sharing.
 */
export function isOperationalServiceClause(clause: string, ruleId?: string): boolean {
  // Only applies to third-party sharing and selling rules
  if (ruleId !== 'share_sell_rent' && ruleId !== 'share_marketing_partners' && ruleId !== 'share_debt_brokers') {
    return false;
  }

  const normalized = clause.toLowerCase();

  const isOperational =
    /\b(service\s*providers?|vendors?|contractors?|hosting\s*(providers?|infrastructure)|payment\s*processors?|fraud\s*prevention|analytics\s*to\s*(improve|understand)\s*(our\s*)?(services?|website)|comply\s*with\s*(legal\s*obligations?|applicable\s*laws?|court\s*orders?)|legal\s*compliance|to\s*operate\s*our\s*services?|perform\s*services\s*on\s*our\s*behalf)\b/i.test(
      normalized
    );

  const isExplicitPredatory =
    /\b(sell(ing)?\s+(your\s+)?(personal\s*(data|info)|email)|data\s*brokers?|debt\s*collect(ion|ors?)|cross-context|behavioral\s*advertising)\b/i.test(
      normalized
    );

  // If it's describing operational service providers and doesn't explicitly state selling data or debt brokers, exempt it!
  return isOperational && !isExplicitPredatory;
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
 * Returns null if no actual sentence matches or if the sentence contains an active negation or operational exemption.
 */
export function extractGroundedSnippet(text: string, pattern: RegExp, ruleId?: string): string | null {
  const clauses = splitIntoClauses(text);

  for (const clause of clauses) {
    if (pattern.test(clause)) {
      if (isNegatedClause(clause)) {
        continue;
      }
      if (isOperationalServiceClause(clause, ruleId)) {
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
      if (isOperationalServiceClause(line, ruleId)) {
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
      return `Caution: We found ${findingsCount} items you should know about. Some terms or permissions require your review to ensure they match your preferences.`;
    case 'privacy_pro':
      return `Moderate exposure profile (${score}/100). Identifies vendor-friendly terms including third-party telemetry, subscription renewal defaults, and legal limitations.`;
    case 'everyday':
    default:
      return `Moderate risk detected (${score}/100). While typical for commercial apps, these terms include standard arbitration, targeted ads, or renewal defaults that warrant your attention.`;
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
      const snippet = extractGroundedSnippet(policyText, pattern, rule.id);
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

  // Calculate score using the untouched scoring formula
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
