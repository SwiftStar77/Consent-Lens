'use client';

import React from 'react';
import { RiskTolerance, UsageContext, UserPersona, ScenarioSample } from '@/lib/types';
import { SAMPLE_SCENARIOS } from '@/lib/samples';
import { MAX_POLICY_LENGTH } from '@/lib/sanitize';
import {
  FileTextIcon,
  GlobeIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  UserIcon,
  LayersIcon,
  ShieldIcon,
  SparklesIcon,
} from './Icons';

interface InputPanelProps {
  inputMode: 'text' | 'url';
  setInputMode: (mode: 'text' | 'url') => void;
  policyText: string;
  setPolicyText: (val: string) => void;
  urlInput: string;
  setUrlInput: (val: string) => void;
  persona: UserPersona;
  setPersona: (p: UserPersona) => void;
  context: UsageContext;
  setContext: (c: UsageContext) => void;
  riskTolerance: RiskTolerance;
  setRiskTolerance: (t: RiskTolerance) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onSelectSample: (sample: ScenarioSample) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export function InputPanel({
  inputMode,
  setInputMode,
  policyText,
  setPolicyText,
  urlInput,
  setUrlInput,
  persona,
  setPersona,
  context,
  setContext,
  riskTolerance,
  setRiskTolerance,
  onAnalyze,
  onClear,
  onSelectSample,
  isLoading,
  errorMessage,
}: InputPanelProps) {
  const isTextMode = inputMode === 'text';
  const charCount = policyText.length;
  const isInputEmpty = isTextMode ? policyText.trim().length === 0 : urlInput.trim().length === 0;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
      {/* Crisp Value Proposition */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--accent-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-subtle)',
          }}
        >
          <ShieldIcon size={14} />
          <span>Context-Aware Consent Copilot</span>
        </div>
        <h1 style={{ fontSize: '1.4375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Understand what you&apos;re consenting to.
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
          Detect hidden trackers, predatory fine print, and unnecessary permissions before clicking accept.
        </p>
      </div>

      {/* Main Unified Input Card */}
      <section className="elevated-card" aria-label="Privacy policy analysis input">
        {/* Mode Switcher Tabs */}
        <div className="mode-tabs" role="tablist" aria-label="Input format selector">
          <button
            type="button"
            role="tab"
            aria-selected={isTextMode}
            className={`mode-tab-btn ${isTextMode ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
          >
            <FileTextIcon size={16} />
            <span>Paste Policy or Permissions</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isTextMode}
            className={`mode-tab-btn ${!isTextMode ? 'active' : ''}`}
            onClick={() => setInputMode('url')}
          >
            <GlobeIcon size={16} />
            <span>Check Website or App Link</span>
          </button>
        </div>

        {/* Input Area */}
        <div style={{ marginBottom: '1.25rem' }}>
          {isTextMode ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.375rem',
                }}
              >
                <label
                  htmlFor="policy-input-area"
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Paste Terms, Privacy Notice, or App Permissions:
                </label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: charCount > MAX_POLICY_LENGTH * 0.9 ? 'var(--risk-high-text)' : 'var(--text-muted)',
                  }}
                >
                  {charCount.toLocaleString()} / {MAX_POLICY_LENGTH.toLocaleString()} chars
                </span>
              </div>
              <textarea
                id="policy-input-area"
                className="policy-textarea-v2"
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Paste terms of service, privacy policy clauses, cookie notices, or Android permission lists here..."
                aria-required="true"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="url-input-field"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.375rem',
                }}
              >
                Enter Privacy Policy or Service Web Address:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="url-input-field"
                  type="url"
                  className="form-input-text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/privacy or service domain..."
                  aria-required="true"
                />
              </div>
              <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                ConsentLens validates the link, prevents SSRF, and evaluates privacy terms directly.
              </small>
            </div>
          )}
        </div>

        {/* Quick-Start Sample Chips */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '0.4rem',
            }}
          >
            Quick-Start Realistic Scenarios:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {SAMPLE_SCENARIOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                className="sample-chip"
                onClick={() => onSelectSample(sample)}
                title={sample.description}
              >
                <SparklesIcon size={12} />
                <span>
                  {sample.id === 'predatory_loan'
                    ? 'Try: Instant-Loan App'
                    : sample.id === 'saas_trial'
                    ? 'Try: SaaS Free Trial'
                    : 'Try: Safe Offline Tool'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Context Selectors as Clean Horizontal Tactile Pills */}
        <div className="subtle-panel" style={{ marginBottom: '1.5rem' }}>
          {/* Who are you? */}
          <div className="pill-selector-group">
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <UserIcon size={14} />
              <span>Who are you?</span>
            </label>
            <div className="pill-row" role="radiogroup" aria-label="User persona selector">
              <button
                type="button"
                role="radio"
                aria-checked={persona === 'everyday'}
                className={`context-pill ${persona === 'everyday' ? 'active' : ''}`}
                onClick={() => setPersona('everyday')}
              >
                <span>Everyday User</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={persona === 'accessibility'}
                className={`context-pill ${persona === 'accessibility' ? 'active' : ''}`}
                onClick={() => setPersona('accessibility')}
              >
                <span>Plain-Language Mode</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={persona === 'privacy_pro'}
                className={`context-pill ${persona === 'privacy_pro' ? 'active' : ''}`}
                onClick={() => setPersona('privacy_pro')}
              >
                <span>Privacy-Strict</span>
              </button>
            </div>
          </div>

          {/* What is this for? */}
          <div className="pill-selector-group" style={{ marginBottom: 0 }}>
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <LayersIcon size={14} />
              <span>What is this for?</span>
            </label>
            <div className="pill-row" role="radiogroup" aria-label="Usage context selector">
              <button
                type="button"
                role="radio"
                aria-checked={context === 'utility'}
                className={`context-pill ${context === 'utility' ? 'active' : ''}`}
                onClick={() => setContext('utility')}
              >
                <span>Simple Utility</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={context === 'finance'}
                className={`context-pill ${context === 'finance' ? 'active' : ''}`}
                onClick={() => setContext('finance')}
              >
                <span>Finance / Loan</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={context === 'saas'}
                className={`context-pill ${context === 'saas' ? 'active' : ''}`}
                onClick={() => setContext('saas')}
              >
                <span>SaaS / AI Tool</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={context === 'health'}
                className={`context-pill ${context === 'health' ? 'active' : ''}`}
                onClick={() => setContext('health')}
              >
                <span>Health / Fitness</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '0.625rem 0.875rem',
              backgroundColor: 'var(--risk-high-bg)',
              color: 'var(--risk-high-text)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Primary Action Button */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-cta"
            onClick={onAnalyze}
            disabled={isLoading || isInputEmpty}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#FFFFFF',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <span>Scanning clauses & permissions...</span>
              </>
            ) : (
              <>
                <span>Analyze Risks Now</span>
                <ArrowRightIcon size={18} />
              </>
            )}
          </button>

          {!isInputEmpty && (
            <button
              type="button"
              className="btn-subtle"
              onClick={onClear}
              title="Clear input"
              style={{ flexShrink: 0 }}
            >
              <RotateCcwIcon size={15} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
