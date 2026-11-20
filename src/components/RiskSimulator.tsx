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
    <section className="elevated-card" aria-labelledby="simulator-card-title">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SlidersIcon size={16} />
            </div>
            <h2 id="simulator-card-title" style={{ fontSize: '1.0625rem' }}>
              What If I Turn These Off?
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Simulate revoking invasive device permissions or opting out of clauses to preview your risk reduction.
          </p>
        </div>

        {disabledCount > 0 && (
          <button
            type="button"
            className="btn-subtle"
            onClick={onResetSimulator}
            title="Reset all toggles"
          >
            <RotateCcwIcon size={14} />
            <span>Reset Toggles</span>
          </button>
        )}
      </div>

      {/* Metric Delta Strip */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Simulated Score:
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {simulatedScore}
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>/ 100</span>

          {scoreDelta < 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--risk-low-text)',
                backgroundColor: 'var(--risk-low-bg)',
                border: '1px solid var(--risk-low-border)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-pill)',
                marginLeft: '0.25rem',
              }}
            >
              {scoreDelta} pts risk reduction
            </span>
          )}
        </div>

        <span
          className={`badge-risk ${
            simulatedSeverity === 'high'
              ? 'badge-risk-high'
              : simulatedSeverity === 'medium'
              ? 'badge-risk-medium'
              : 'badge-risk-low'
          }`}
        >
          {simulatedSeverity === 'high' && <AlertTriangleIcon size={12} />}
          {simulatedSeverity === 'medium' && <AlertCircleIcon size={12} />}
          {(simulatedSeverity === 'low' || simulatedSeverity === 'safe') && (
            <CheckCircleIcon size={12} />
          )}
          <span>{simulatedSeverity} Risk</span>
        </span>
      </div>

      {/* Toggle Rows */}
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
                padding: '0.75rem 1rem',
                backgroundColor: isOff ? 'var(--risk-low-bg)' : 'var(--bg-surface)',
                border: isOff ? '1px solid var(--risk-low-border)' : '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
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
                      padding: '0.125rem 0.4rem',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor: 'var(--bg-subtle)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-card-subtle)',
                    }}
                  >
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: isOff ? 'var(--risk-low-text)' : 'var(--text-secondary)',
                    marginTop: '0.2rem',
                  }}
                >
                  {isOff
                    ? 'Simulated as Denied / Opted-Out: Risk neutralized'
                    : `Active grant (+${item.weight} pts impact)`}
                </p>
              </div>

              <label
                htmlFor={`sim-toggle-${item.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                  margin: 0,
                }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {isOff ? 'Opted Out' : 'Allowed'}
                </span>
                <input
                  id={`sim-toggle-${item.id}`}
                  type="checkbox"
                  role="switch"
                  aria-checked={!isOff}
                  checked={!isOff}
                  onChange={() => onToggleFinding(item.id)}
                  className="switch-input-tactile"
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
