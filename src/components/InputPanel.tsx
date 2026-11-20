'use client';

import React from 'react';
import { MAX_POLICY_LENGTH } from '@/lib/sanitize';
import {
  FileTextIcon,
  GlobeIcon,
  ArrowRightIcon,
  RotateCcwIcon,
  ShieldIcon,
} from './Icons';

interface InputPanelProps {
  inputMode: 'text' | 'url';
  setInputMode: (mode: 'text' | 'url') => void;
  policyText: string;
  setPolicyText: (val: string) => void;
  urlInput: string;
  setUrlInput: (val: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
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
  onAnalyze,
  onClear,
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
          <span>Context-Aware Consent Auditor</span>
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
        <div style={{ marginBottom: '1.5rem' }}>
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

        {/* Error notification if any */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--risk-high-bg)',
              color: 'var(--risk-high-text)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
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
