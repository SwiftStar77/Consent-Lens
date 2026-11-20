'use client';

import React from 'react';
import { RiskItem, RiskSeverity } from '@/lib/types';
import { SlidersIcon, RotateCcwIcon, CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon } from './Icons';

interface RiskSimulatorProps {
  findings: RiskItem[];
  onToggleFinding: (id: string) => void;
  onResetSimulator: () => void;
  originalScore: number;
  simulatedScore: number;
  simulatedSeverity: RiskSeverity;
  scoreDelta: number;
}

export function RiskSimulator({
  findings,
  onToggleFinding,
  onResetSimulator,
  originalScore,
  simulatedScore,
  simulatedSeverity,
  scoreDelta,
}: RiskSimulatorProps) {
  const toggleableItems = findings.filter((f) => f.isToggleable);

  if (toggleableItems.length === 0) {
    return null;
  }

  const disabledCount = toggleableItems.filter((f) => f.isSimulatedDisabled).length;

  return (
    <section
      className="card"
      style={{
        marginTop: '1.25rem',
        borderLeft: '4px solid var(--accent-primary)',
      }}
      aria-labelledby="simulator-heading"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h2 id="simulator-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SlidersIcon size={18} />
            <span>Interactive Risk & Permission Simulator</span>
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Simulate revoking invasive device permissions or opting out of clauses to preview your risk reduction.
          </p>
        </div>

        {disabledCount > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onResetSimulator}
            title="Reset all simulated permission toggles"
          >
            <RotateCcwIcon size={14} />
            <span>Reset Simulator</span>
          </button>
        )}
      </div>

      {/* Simulator Score Metric Banner */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-stone)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
            Simulated Risk Score
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {simulatedScore}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>/ 100</span>
            {scoreDelta < 0 && (
              <span
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--risk-safe-text)',
                  backgroundColor: 'var(--risk-safe-bg)',
                  padding: '0.125rem 0.375rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {scoreDelta} pts risk reduction
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className={`badge-risk ${
              simulatedSeverity === 'high'
                ? 'badge-risk-high'
                : simulatedSeverity === 'medium'
                ? 'badge-risk-medium'
                : 'badge-risk-safe'
            }`}
          >
            {simulatedSeverity === 'high' && <AlertTriangleIcon size={14} />}
            {simulatedSeverity === 'medium' && <AlertCircleIcon size={14} />}
            {(simulatedSeverity === 'low' || simulatedSeverity === 'safe') && <CheckCircleIcon size={14} />}
            <span>{simulatedSeverity} Risk</span>
          </span>
        </div>
      </div>

      {/* Toggles list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {toggleableItems.map((item) => {
          const isOff = !!item.isSimulatedDisabled;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.75rem',
                backgroundColor: isOff ? 'var(--risk-safe-bg)' : 'var(--bg-surface)',
                border: isOff ? '1px solid var(--risk-safe-border)' : '1px solid var(--border-stone)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ flex: 1, paddingRight: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {item.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      padding: '0.125rem 0.375rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-stone-subtle)',
                    }}
                  >
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: isOff ? 'var(--risk-safe-text)' : 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {isOff
                    ? 'Simulated as Denied / Opted-Out: Threat neutralized'
                    : `Active grant: +${item.weight} risk weight points`}
                </p>
              </div>

              <label
                htmlFor={`toggle-${item.id}`}
                className="switch-label"
                style={{ margin: 0, userSelect: 'none' }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {isOff ? 'Opted Out' : 'Active'}
                </span>
                <input
                  id={`toggle-${item.id}`}
                  type="checkbox"
                  role="switch"
                  aria-checked={!isOff}
                  checked={!isOff}
                  onChange={() => onToggleFinding(item.id)}
                  className="switch-input"
                  aria-label={`Toggle simulation for ${item.title}`}
                />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
