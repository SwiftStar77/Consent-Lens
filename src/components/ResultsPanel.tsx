'use client';

/**
 * Stage 2: Scannable Results & Action View Component
 *
 * Renders the comprehensive policy audit results:
 * 1. Top Navigation & Engine Indicator (Gemini AI or Deep Rule Engine)
 * 2. Hero Risk Summary Card with RadialRiskMeter and Executive Verdict
 * 3. Interactive Risk Simulator ("What If I Turn These Off?")
 * 4. Progressive Disclosure Breakdown with Grounded Quotes
 * 5. One-Click Action Card with Countermeasures Checklist & Pre-drafted Opt-Out Letter
 */

import React, { useState } from 'react';
import { AnalysisResult, RiskCategory, RiskItem, UserPersona } from '@/lib/types';
import { RadialRiskMeter } from './RadialRiskMeter';
import { RiskSimulator } from './RiskSimulator';
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  CpuIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FileTextIcon,
  ShieldIcon,
  InfoIcon,
  ActivityIcon,
  ClockIcon,
} from './Icons';

/**
 * Props for ResultsPanel Component
 */
interface ResultsPanelProps {
  /** Full analysis result returned from backend */
  result: AnalysisResult;
  /** Dynamically simulated score reflecting toggled-off findings */
  simulatedScore: number;
  /** Dynamically simulated severity tier */
  simulatedSeverity: AnalysisResult['verdictSeverity'];
  /** Numerical difference between baseline score and simulated score */
  scoreDelta: number;
  /** Array of active risk items */
  findings: RiskItem[];
  /** Callback to toggle a finding switch */
  onToggleFinding: (id: string) => void;
  /** Callback to reset simulator toggles */
  onResetSimulator: () => void;
  /** Callback to navigate back to Stage 1 input */
  onBack: () => void;
  /** User persona active during analysis */
  persona: UserPersona;
}

/** Icon mapping for risk categories */
const CATEGORY_ICONS: Record<RiskCategory, React.ReactNode> = {
  data_collection: <ShieldIcon size={16} />,
  third_party_sharing: <FileTextIcon size={16} />,
  financial_lockin: <AlertCircleIcon size={16} />,
  retention_security: <AlertTriangleIcon size={16} />,
};

/**
 * Formats an ISO reset timestamp into clear local date and time.
 * e.g., "Nov 23, 2026, 1:30 PM"
 */
function formatResetTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
}

export function ResultsPanel({
  result,
  simulatedScore,
  simulatedSeverity,
  scoreDelta,
  findings,
  onToggleFinding,
  onResetSimulator,
  onBack,
  persona,
}: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /**
   * Copies the pre-drafted opt-out request letter to clipboard with fallback
   */
  const handleCopyOptOut = async () => {
    if (!result.optOutDraft) return;
    try {
      await navigator.clipboard.writeText(result.optOutDraft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = result.optOutDraft;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  /**
   * Toggles progressive disclosure accordion on finding cards
   */
  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Highlights to show on right side of Hero Card
  const keyHighlights = findings.slice(0, 3).map((f) => f.title);
  if (result.permissionAnomalies.length > 0) {
    keyHighlights.unshift('Category permission anomalies detected');
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* =================================================================== */}
      {/* Top Navigation & Status Bar                                         */}
      {/* =================================================================== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <button
          type="button"
          className="btn-subtle"
          onClick={onBack}
          aria-label="Return to input screen"
          style={{ padding: '0.5rem 0.875rem' }}
        >
          <ArrowLeftIcon size={16} />
          <span style={{ fontWeight: 600 }}>Analyze Another</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Transparent Engine Indicator Badge */}
          <span className="engine-pill">
            {result.engineUsed === 'live_ai' || result.engineUsed === 'Gemini AI' ? (
              <>
                <SparklesIcon size={13} />
                <span>Analysis Engine: Gemini AI</span>
              </>
            ) : (
              <>
                <CpuIcon size={13} />
                <span>Analysis Engine: Deep Rule Engine</span>
              </>
            )}
          </span>

          {/* Gemini API Quota Usage % & Local Reset Timestamp */}
          {result.quotaStatus && (
            <span
              className="engine-pill"
              style={{
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
              title={`Gemini API Requests: ${result.quotaStatus.totalRequestsToday} / ${result.quotaStatus.limitRequests} (${result.quotaStatus.usagePercent}% used)`}
            >
              <ActivityIcon size={13} />
              <span>API Usage: {result.quotaStatus.usagePercent}%</span>
              {result.quotaStatus.resetAt && (
                <>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <ClockIcon size={12} />
                  <span>Resets {formatResetTime(result.quotaStatus.resetAt)}</span>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. Hero Risk Summary Card                                           */}
      {/* =================================================================== */}
      <section className="elevated-card" aria-label="Risk assessment overview">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {/* Left: SVG Radial Meter */}
          <div>
            <RadialRiskMeter score={simulatedScore} severity={simulatedSeverity} size={136} />
          </div>

          {/* Right: Human Advisor Takeaway */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--accent-tint)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--accent-tint-border)',
                }}
              >
                Executive Takeaway
              </span>
            </div>

            <h2 style={{ fontSize: '1.1875rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.5rem' }}>
              {result.executiveVerdict}
            </h2>

            {/* Quick Bullet Highlights */}
            {keyHighlights.length > 0 && (
              <div style={{ marginTop: '0.875rem' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '0.35rem',
                  }}
                >
                  Key Findings:
                </span>
                <ul
                  style={{
                    paddingLeft: '1.25rem',
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {keyHighlights.slice(0, 3).map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.2rem' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Anomaly banner if present */}
        {result.permissionAnomalies.length > 0 && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--risk-high-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginBottom: '0.25rem',
              }}
            >
              <AlertTriangleIcon size={14} />
              <span>Permission Category Anomaly</span>
            </span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--risk-high-text)' }}>
              {result.permissionAnomalies.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 2. Interactive Risk Simulator ("What If I Turn These Off?")         */}
      {/* =================================================================== */}
      <RiskSimulator
        findings={findings}
        onToggleFinding={onToggleFinding}
        onResetSimulator={onResetSimulator}
        originalScore={result.score}
        simulatedScore={simulatedScore}
        simulatedSeverity={simulatedSeverity}
        scoreDelta={scoreDelta}
      />

      {/* =================================================================== */}
      {/* 3. Progressive Disclosure Breakdown                                 */}
      {/* =================================================================== */}
      <section className="elevated-card" aria-label="Detailed findings breakdown">
        <div style={{ marginBottom: '1.125rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
            Top Detected Risks & Clauses ({findings.length})
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Click any card to inspect the exact clause quotation and plain-English impact details.
          </p>
        </div>

        {findings.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              backgroundColor: 'var(--risk-low-bg)',
              border: '1px solid var(--risk-low-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--risk-low-text)',
              fontSize: '0.875rem',
            }}
          >
            <CheckCircleIcon size={20} style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ fontWeight: 600, margin: 0 }}>No high or medium risk clauses detected.</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              The analyzed terms follow data minimization principles.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {findings.map((finding) => {
              const isExpanded = expandedId === finding.id;
              return (
                <article
                  key={finding.id}
                  className={`accordion-risk-card ${isExpanded ? 'expanded' : ''}`}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {CATEGORY_ICONS[finding.category]}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{finding.title}</h3>
                          <span
                            className={`badge-risk ${
                              finding.severity === 'high'
                                ? 'badge-risk-high'
                                : finding.severity === 'medium'
                                ? 'badge-risk-medium'
                                : 'badge-risk-low'
                            }`}
                          >
                            {finding.severity}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {finding.harm}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-subtle"
                      style={{ flexShrink: 0, padding: '0.35rem 0.625rem', fontSize: '0.75rem' }}
                      onClick={() => toggleExpand(finding.id)}
                      aria-expanded={isExpanded}
                      aria-label={`Toggle details for ${finding.title}`}
                    >
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                    </button>
                  </div>

                  {/* Collapsed Detailed Section */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '0.875rem',
                        paddingTop: '0.875rem',
                        borderTop: '1px solid var(--border-card-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.625rem',
                      }}
                    >
                      {(finding.matchedExcerpt || finding.originalClause) && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                color: 'var(--accent-primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              Grounded Text Evidence (Matched Excerpt):
                            </span>
                          </div>
                          <blockquote
                            style={{
                              fontSize: '0.8125rem',
                              fontStyle: 'italic',
                              color: 'var(--text-primary)',
                              backgroundColor: 'var(--bg-subtle)',
                              padding: '0.625rem 0.875rem',
                              borderRadius: 'var(--radius-sm)',
                              borderLeft: '3px solid var(--accent-primary)',
                              margin: 0,
                            }}
                          >
                            &ldquo;{finding.matchedExcerpt || finding.originalClause}&rdquo;
                          </blockquote>
                        </div>
                      )}

                      {finding.plainLanguageNote && (
                        <div
                          style={{
                            padding: '0.625rem 0.875rem',
                            backgroundColor: '#FEF9C3',
                            border: '1px solid #FDE047',
                            borderRadius: 'var(--radius-sm)',
                            color: '#713F12',
                            fontSize: '0.8125rem',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                          }}
                        >
                          <InfoIcon size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{finding.plainLanguageNote}</span>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 4. One-Click Action Card                                            */}
      {/* =================================================================== */}
      <section
        className="elevated-card"
        style={{
          backgroundColor: 'var(--accent-tint)',
          borderColor: 'var(--accent-tint-border)',
        }}
        aria-label="Recommended protective actions"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-primary)',
                display: 'block',
                marginBottom: '0.25rem',
              }}
            >
              Take Action Now
            </span>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recommended Next Steps
            </h2>
          </div>

          <button
            type="button"
            className="btn-cta"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
            onClick={handleCopyOptOut}
            aria-label="Copy customized opt-out letter"
          >
            {copied ? (
              <>
                <CheckIcon size={15} />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <CopyIcon size={15} />
                <span>Copy Opt-Out Request</span>
              </>
            )}
          </button>
        </div>

        {/* Countermeasures checklist */}
        <ul
          style={{
            paddingLeft: '1.25rem',
            margin: '0 0 1.25rem 0',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            lineHeight: 1.6,
          }}
        >
          {result.countermeasures.map((step, idx) => (
            <li key={idx} style={{ marginBottom: '0.4rem' }}>
              {step}
            </li>
          ))}
        </ul>

        {/* Pre-drafted letter preview */}
        <div style={{ marginTop: '0.75rem' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.35rem',
            }}
          >
            Pre-Drafted {persona === 'privacy_pro' ? 'Statutory Notice' : 'Data Rights Request'}:
          </span>
          <pre
            tabIndex={0}
            aria-label="Generated opt-out letter text"
            style={{
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {result.optOutDraft}
          </pre>
        </div>
      </section>
    </div>
  );
}
