'use client';

import React, { useState } from 'react';
import { AnalysisResult, RiskCategory, RiskItem, UserPersona } from '@/lib/types';
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  CpuIcon,
  FileTextIcon,
  InfoIcon,
  SparklesIcon,
  ShieldIcon,
} from './Icons';

interface ResultsPanelProps {
  result: AnalysisResult | null;
  persona: UserPersona;
  isLoading: boolean;
}

const CATEGORY_META: Record<
  RiskCategory,
  { label: string; description: string }
> = {
  data_collection: {
    label: 'Data Collection & Permissions',
    description: 'Hardware, identity, and personal records accessed by the service.',
  },
  third_party_sharing: {
    label: 'Third-Party Sharing & Ad Brokers',
    description: 'External companies, advertisers, and debt collectors receiving your data.',
  },
  financial_lockin: {
    label: 'Financial Traps & Lock-In',
    description: 'Auto-renewal conversions, recurring debits, and punitive cancellation terms.',
  },
  retention_security: {
    label: 'Retention, AI Training & Rights',
    description: 'Data lifespan, AI training on user uploads, and court/jury trial waivers.',
  },
};

export function ResultsPanel({ result, persona, isLoading }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyOptOut = async () => {
    if (!result?.optOutDraft) return;
    try {
      await navigator.clipboard.writeText(result.optOutDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for clipboard
      const textArea = document.createElement('textarea');
      textArea.value = result.optOutDraft;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div
        className="card"
        style={{
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}
        aria-live="polite"
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid var(--border-stone)',
            borderTopColor: 'var(--accent-primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Analyzing Consent & Legal Terms</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Extracting clauses, comparing context permissions, and scoring risks...
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="card"
        style={{
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-subtle)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <ShieldIcon size={24} />
        </div>
        <h2 style={{ fontSize: '1.0625rem', marginBottom: '0.375rem' }}>
          Ready for Risk Analysis
        </h2>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            maxWidth: '380px',
            lineHeight: 1.5,
          }}
        >
          Select one of the sample scenarios from the top bar or paste a privacy policy or permission manifest on the left to inspect hidden risks and dark patterns.
        </p>
      </div>
    );
  }

  const {
    score,
    verdictSeverity,
    executiveVerdict,
    findings,
    permissionAnomalies,
    countermeasures,
    optOutDraft,
    engineUsed,
  } = result;

  // Group findings by category
  const categories: RiskCategory[] = [
    'data_collection',
    'third_party_sharing',
    'financial_lockin',
    'retention_security',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Overall Risk Verdict Banner */}
      <section
        className="card"
        style={{
          borderTop: `4px solid ${
            verdictSeverity === 'high'
              ? 'var(--risk-high-text)'
              : verdictSeverity === 'medium'
              ? 'var(--risk-medium-text)'
              : 'var(--risk-safe-text)'
          }`,
        }}
        aria-labelledby="verdict-banner-title"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className={`badge-risk ${
                verdictSeverity === 'high'
                  ? 'badge-risk-high'
                  : verdictSeverity === 'medium'
                  ? 'badge-risk-medium'
                  : 'badge-risk-safe'
              }`}
            >
              {verdictSeverity === 'high' && <AlertTriangleIcon size={14} />}
              {verdictSeverity === 'medium' && <AlertCircleIcon size={14} />}
              {(verdictSeverity === 'low' || verdictSeverity === 'safe') && (
                <CheckCircleIcon size={14} />
              )}
              <span>{verdictSeverity} Risk Verdict</span>
            </span>

            <span className="engine-pill">
              {engineUsed === 'live_ai' ? (
                <>
                  <SparklesIcon size={13} />
                  <span>Analysis Engine: Live AI</span>
                </>
              ) : (
                <>
                  <CpuIcon size={13} />
                  <span>Analysis Engine: Local Rule Engine</span>
                </>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Overall Risk Score:
            </span>
            <span
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color:
                  verdictSeverity === 'high'
                    ? 'var(--risk-high-text)'
                    : verdictSeverity === 'medium'
                    ? 'var(--risk-medium-text)'
                    : 'var(--risk-safe-text)',
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
        </div>

        <h2 id="verdict-banner-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
          Executive Assessment
        </h2>
        <p
          style={{
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}
        >
          {executiveVerdict}
        </p>

        {/* Permission Anomalies Callout */}
        {permissionAnomalies.length > 0 && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--risk-high-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginBottom: '0.375rem',
              }}
            >
              <AlertTriangleIcon size={14} />
              <span>Permission Category Anomalies Detected</span>
            </span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--risk-high-text)' }}>
              {permissionAnomalies.map((anomaly, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  {anomaly}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 2. Categorized Risk Findings */}
      <section className="card" aria-labelledby="findings-heading">
        <h2 id="findings-heading" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileTextIcon size={18} />
          <span>Detailed Clause & Permission Breakdown ({findings.length} findings)</span>
        </h2>

        {findings.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            No high or medium severity risk clauses were identified in this policy text.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map((catKey) => {
              const catFindings = findings.filter((f) => f.category === catKey);
              if (catFindings.length === 0) return null;

              return (
                <div key={catKey} style={{ borderBottom: '1px solid var(--border-stone-subtle)', paddingBottom: '0.75rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {CATEGORY_META[catKey].label} ({catFindings.length})
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {CATEGORY_META[catKey].description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {catFindings.map((finding: RiskItem) => (
                      <div key={finding.id} className="finding-item">
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {finding.title}
                          </span>
                          <span
                            className={`badge-risk ${
                              finding.severity === 'high'
                                ? 'badge-risk-high'
                                : finding.severity === 'medium'
                                ? 'badge-risk-medium'
                                : 'badge-risk-safe'
                            }`}
                          >
                            {finding.severity}
                          </span>
                        </div>

                        {finding.originalClause && (
                          <blockquote className="finding-clause-quote">
                            &ldquo;{finding.originalClause}&rdquo;
                          </blockquote>
                        )}

                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
                          <strong>Harm:</strong> {finding.harm}
                        </p>

                        {finding.plainLanguageNote && (
                          <div className="finding-plain-note">
                            <InfoIcon size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{finding.plainLanguageNote}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Actionable Countermeasures */}
      <section className="card" aria-labelledby="countermeasures-heading">
        <h2 id="countermeasures-heading" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircleIcon size={18} />
          <span>Recommended Protective Actions</span>
        </h2>
        <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          {countermeasures.map((step, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>
              {step}
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Tailored Opt-Out & Data Rights Letter */}
      <section className="card" aria-labelledby="optout-heading">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <div>
            <h2 id="optout-heading" style={{ margin: 0 }}>
              Tailored Opt-Out & Data Rights Request
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Pre-drafted message formatted for your persona to send to the provider or app support.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyOptOut}
            aria-label="Copy opt-out request text to clipboard"
          >
            {copied ? (
              <>
                <CheckIcon size={14} />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <CopyIcon size={14} />
                <span>Copy Request</span>
              </>
            )}
          </button>
        </div>

        <pre
          tabIndex={0}
          aria-label="Generated opt-out letter draft"
          style={{
            fontFamily: 'inherit',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            padding: '0.875rem',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-stone)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {optOutDraft}
        </pre>
      </section>
    </div>
  );
}
