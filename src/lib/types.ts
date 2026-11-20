export type UserPersona = 'everyday' | 'accessibility' | 'privacy_pro';

export type UsageContext = 'utility' | 'finance' | 'saas' | 'health';

export type RiskTolerance = 'standard' | 'strict';

export type RiskSeverity = 'high' | 'medium' | 'low' | 'safe';

export type RiskCategory =
  | 'data_collection'
  | 'third_party_sharing'
  | 'financial_lockin'
  | 'retention_security';

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  originalClause: string;
  harm: string;
  plainLanguageNote: string;
  isToggleable: boolean;
  isSimulatedDisabled?: boolean;
  weight: number;
}

export interface AnalysisResult {
  score: number; // 0 to 100
  verdictSeverity: RiskSeverity;
  executiveVerdict: string;
  findings: RiskItem[];
  permissionAnomalies: string[];
  countermeasures: string[];
  optOutDraft: string;
  engineUsed: 'live_ai' | 'local_rule_engine';
  analyzedAt: string;
}

export interface AnalyzeRequestPayload {
  policyText: string;
  persona: UserPersona;
  context: UsageContext;
  riskTolerance: RiskTolerance;
}

export interface ScenarioSample {
  id: string;
  name: string;
  description: string;
  defaultPersona: UserPersona;
  defaultContext: UsageContext;
  defaultTolerance: RiskTolerance;
  content: string;
}

export function isValidPersona(val: unknown): val is UserPersona {
  return val === 'everyday' || val === 'accessibility' || val === 'privacy_pro';
}

export function isValidContext(val: unknown): val is UsageContext {
  return val === 'utility' || val === 'finance' || val === 'saas' || val === 'health';
}

export function isValidTolerance(val: unknown): val is RiskTolerance {
  return val === 'standard' || val === 'strict';
}

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
  return true;
}
