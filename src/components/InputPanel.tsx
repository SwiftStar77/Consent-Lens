'use client';

import React from 'react';
import { RiskTolerance, UsageContext, UserPersona } from '@/lib/types';
import { MAX_POLICY_LENGTH } from '@/lib/sanitize';
import { RotateCcwIcon, SearchIcon, UserIcon, SlidersIcon, ShieldIcon } from './Icons';

interface InputPanelProps {
  policyText: string;
  setPolicyText: (val: string) => void;
  persona: UserPersona;
  setPersona: (val: UserPersona) => void;
  context: UsageContext;
  setContext: (val: UsageContext) => void;
  riskTolerance: RiskTolerance;
  setRiskTolerance: (val: RiskTolerance) => void;
  onAnalyze: () => void;
  onClear: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function InputPanel({
  policyText,
  setPolicyText,
  persona,
  setPersona,
  context,
  setContext,
  riskTolerance,
  setRiskTolerance,
  onAnalyze,
  onClear,
  isLoading,
  errorMessage,
}: InputPanelProps) {
  const charCount = policyText.length;
  const isTooShort = policyText.trim().length < 10;

  return (
    <section className="card" aria-labelledby="input-controls-title">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 id="input-controls-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <SlidersIcon size={18} />
          <span>Evaluation Parameters</span>
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Configure the evaluation context to adapt scoring weights and Plain-English explanations.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Persona Selector */}
        <div>
          <label htmlFor="persona-select" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <UserIcon size={14} />
            <span>Target Persona</span>
          </label>
          <select
            id="persona-select"
            className="form-select"
            value={persona}
            onChange={(e) => setPersona(e.target.value as UserPersona)}
            aria-describedby="persona-help"
          >
            <option value="everyday">Everyday User (Balanced clarity & common harms)</option>
            <option value="accessibility">Accessibility & Plain-Language First (Zero jargon, short sentences)</option>
            <option value="privacy_pro">Privacy-Strict Professional (Strict brokering & legal audit)</option>
          </select>
          <small id="persona-help" style={{ display: 'block', marginTop: '0.25rem' }}>
            {persona === 'accessibility' && 'Adapts all outputs into plain-language bullet points without legalese.'}
            {persona === 'privacy_pro' && 'Applies rigorous legal standard to telemetry, brokering, and dispute waivers.'}
            {persona === 'everyday' && 'Balances ease of reading with actionable fraud and privacy protection.'}
          </small>
        </div>

        {/* Application Category Context */}
        <div>
          <label htmlFor="context-select" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <ShieldIcon size={14} />
            <span>Application Context</span>
          </label>
          <select
            id="context-select"
            className="form-select"
            value={context}
            onChange={(e) => setContext(e.target.value as UsageContext)}
            aria-describedby="context-help"
          >
            <option value="finance">Finance / Instant Loan / Banking</option>
            <option value="saas">SaaS / Subscription / AI Tool</option>
            <option value="utility">Utility / Flashlight / Simple Tool</option>
            <option value="health">Health / Fitness / Wearable</option>
          </select>
          <small id="context-help" style={{ display: 'block', marginTop: '0.25rem' }}>
            {context === 'finance' && 'Identifies debt-collection contact harvesting and auto-debit traps.'}
            {context === 'saas' && 'Flags silent annual renewal traps and model-training licenses on user uploads.'}
            {context === 'utility' && 'Marks contacts, SMS, and GPS access as abnormal high-risk anomalies.'}
            {context === 'health' && 'Surfaces biometric monetization and insurer sharing covenants.'}
          </small>
        </div>

        {/* Risk Sensitivity Toggle */}
        <div>
          <label htmlFor="tolerance-select" className="form-label">
            Risk Sensitivity
          </label>
          <select
            id="tolerance-select"
            className="form-select"
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value as RiskTolerance)}
          >
            <option value="standard">Standard Sensitivity (Balanced risk scoring)</option>
            <option value="strict">Strict Sensitivity (1.25x penalty on telemetry & tracking)</option>
          </select>
        </div>
      </div>

      {/* Policy Text Input */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
          <label htmlFor="policy-textarea" className="form-label" style={{ margin: 0 }}>
            Policy, Permissions, or Terms Text
          </label>
          <span style={{ fontSize: '0.75rem', color: charCount > MAX_POLICY_LENGTH * 0.9 ? 'var(--risk-high-text)' : 'var(--text-muted)' }}>
            {charCount.toLocaleString()} / {MAX_POLICY_LENGTH.toLocaleString()} chars
          </span>
        </div>
        <textarea
          id="policy-textarea"
          className="policy-textarea"
          value={policyText}
          onChange={(e) => setPolicyText(e.target.value)}
          placeholder="Paste privacy policy clauses, terms of service, cookie notices, or mobile app permission lists here to analyze..."
          aria-required="true"
        />
      </div>

      {/* Error Message if any */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            padding: '0.625rem 0.75rem',
            backgroundColor: 'var(--risk-high-bg)',
            color: 'var(--risk-high-text)',
            border: '1px solid var(--risk-high-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={onAnalyze}
          disabled={isLoading || isTooShort}
          aria-busy={isLoading}
        >
          <SearchIcon size={16} />
          <span>{isLoading ? 'Analyzing Terms...' : 'Analyze Consent & Risks'}</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onClear}
          disabled={isLoading || policyText.length === 0}
          title="Clear text input"
        >
          <RotateCcwIcon size={15} />
          <span>Clear</span>
        </button>
      </div>
    </section>
  );
}
