/**
 * ConsentLens Core Type Definitions & Validation Guards
 * Defines personas, application contexts, risk severity tiers, and analysis models.
 */

/** User Persona: Tailors plain-language explanations and tone */
export type UserPersona = 'everyday' | 'accessibility' | 'privacy_pro';

/** Usage Context: Defines the functional category of the app or service */
export type UsageContext = 'utility' | 'finance' | 'saas' | 'health';

/** Risk Tolerance: Adjusts sensitivity thresholds for risk detection */
export type RiskTolerance = 'standard' | 'strict';

/** Risk Severity Tiers */
export type RiskSeverity = 'high' | 'medium' | 'low' | 'safe';

/** Risk Category taxonomy */
export type RiskCategory =
  | 'data_collection'
  | 'third_party_sharing'
  | 'financial_lockin'
  | 'retention_security';

/**
 * Individual Risk Finding
 * Represents a single flagged clause, permission, or dark-pattern with verifiable evidence.
 */
export interface RiskItem {
  /** Unique finding identifier (e.g. 'perm_contacts', 'finance_silent_autorenewal') */
  id: string;
  /** Human-readable title of the risk clause */
  title: string;
  /** Plain-language description of what this clause does */
  description: string;
  /** Primary category of risk */
  category: RiskCategory;
  /** Severity level */
  severity: RiskSeverity;
  /** Exact or near-exact grounded text snippet from the analyzed document */
  matchedExcerpt: string;
  /** Backward-compatibility alias for matchedExcerpt */
  originalClause: string;
  /** Concrete consumer harm explanation tailored to persona */
  harm: string;
  /** Plain language summary for accessibility */
  plainLanguageNote: string;
  /** Whether this permission or clause can be toggled/opted-out in the simulator */
  isToggleable: boolean;
  /** Active simulator toggle state */
  isSimulatedDisabled?: boolean;
  /** Mathematical weight (0 to 100) contributing to overall risk score */
  weight: number;
}

/**
 * Complete Policy Analysis Result
 */
export interface AnalysisResult {
  /** Overall risk score from 0 (completely safe) to 100 (critically dangerous) */
  score: number;
  /** Overall severity tier based on computed score */
  verdictSeverity: RiskSeverity;
  /** Concise executive takeaway written for the user persona */
  executiveVerdict: string;
  /** List of text-grounded risk findings */
  findings: RiskItem[];
  /** Abnormal permissions flagged based on app context */
  permissionAnomalies: string[];
  /** Actionable defensive steps the user can execute */
  countermeasures: string[];
  /** Pre-drafted statutory opt-out or data deletion letter */
  optOutDraft: string;
  /** Name of the engine that performed the evaluation ('Gemini AI' or 'Deep Rule Engine') */
  engineUsed: 'Gemini AI' | 'Deep Rule Engine' | 'live_ai' | 'local_rule_engine' | string;
  /** ISO timestamp of when analysis was executed */
  analyzedAt: string;
}

/**
 * Request payload structure for /api/analyze
 */
export interface AnalyzeRequestPayload {
  policyText?: string;
  url?: string;
  inputMode?: 'text' | 'url';
  persona?: UserPersona;
  context?: UsageContext;
  riskTolerance?: RiskTolerance;
}

/**
 * Quick-start preset scenario definition
 */
export interface ScenarioSample {
  id: string;
  name: string;
  description: string;
  defaultPersona: UserPersona;
  defaultContext: UsageContext;
  defaultTolerance: RiskTolerance;
  content: string;
}

/**
 * Type Guard: Validates whether a value is a valid UserPersona
 */
export function isValidPersona(val: unknown): val is UserPersona {
  return val === 'everyday' || val === 'accessibility' || val === 'privacy_pro';
}

/**
 * Type Guard: Validates whether a value is a valid UsageContext
 */
export function isValidContext(val: unknown): val is UsageContext {
  return val === 'utility' || val === 'finance' || val === 'saas' || val === 'health';
}

/**
 * Type Guard: Validates whether a value is a valid RiskTolerance
 */
export function isValidTolerance(val: unknown): val is RiskTolerance {
  return val === 'standard' || val === 'strict';
}

/**
 * Type Guard: Validates the structural integrity of an AnalysisResult payload
 * Ensures all required fields, ranges, and array elements are valid.
 */
export function validateAnalysisResult(data: unknown): data is AnalysisResult {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Partial<AnalysisResult>;

  if (typeof obj.score !== 'number' || obj.score < 0 || obj.score > 100) return false;
  if (!obj.verdictSeverity || !['high', 'medium', 'low', 'safe'].includes(obj.verdictSeverity)) return false;
  if (typeof obj.executiveVerdict !== 'string' || obj.executiveVerdict.trim().length === 0) return false;
  if (!Array.isArray(obj.findings)) return false;
  if (!Array.isArray(obj.permissionAnomalies)) return false;
  if (!Array.isArray(obj.countermeasures)) return false;
  if (typeof obj.optOutDraft !== 'string') return false;

  // Validate and normalize each finding
  for (const item of obj.findings) {
    if (!item || typeof item !== 'object') return false;
    const f = item as unknown as Record<string, unknown>;
    if (typeof f.title !== 'string' || typeof f.category !== 'string') return false;

    // Harmonize matchedExcerpt and originalClause aliases
    if (typeof f.matchedExcerpt !== 'string' && typeof f.originalClause === 'string') {
      f.matchedExcerpt = f.originalClause;
    } else if (typeof f.matchedExcerpt === 'string' && typeof f.originalClause !== 'string') {
      f.originalClause = f.matchedExcerpt;
    } else if (typeof f.matchedExcerpt !== 'string' && typeof f.originalClause !== 'string') {
      return false;
    }
  }

  return true;
}
