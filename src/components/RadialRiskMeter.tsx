'use client';

import React from 'react';
import { RiskSeverity } from '@/lib/types';
import { AlertTriangleIcon, AlertCircleIcon, CheckCircleIcon } from './Icons';

/**
 * Props for RadialRiskMeter Component
 */
interface RadialRiskMeterProps {
  /** Numerical risk score from 0 to 100 */
  score: number;
  /** Categorized severity tier: 'high', 'medium', 'low', or 'safe' */
  severity: RiskSeverity;
  /** Diameter of the SVG meter in pixels (defaults to 132) */
  size?: number;
}

/**
 * Radial Risk Meter Component
 *
 * Renders an animated SVG circular gauge illustrating the computed risk score
 * alongside a high-contrast severity status badge.
 */
export function RadialRiskMeter({ score, severity, size = 132 }: RadialRiskMeterProps) {
  const radius = 48;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  // Resolve color by severity tier
  const color =
    severity === 'high'
      ? 'var(--risk-high-text)'
      : severity === 'medium'
      ? 'var(--risk-medium-text)'
      : 'var(--risk-low-text)';

  // Resolve user-friendly label
  const severityLabel =
    severity === 'high'
      ? 'High Risk'
      : severity === 'medium'
      ? 'Medium Risk'
      : severity === 'low'
      ? 'Low Risk'
      : 'Safe Terms';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      }}
    >
      <div className="radial-meter-container" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 120 120" className="radial-meter-svg">
          {/* Background track circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--bg-subtle)"
            strokeWidth={strokeWidth}
          />
          {/* Animated active score progress circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
            }}
          />
        </svg>

        {/* Centered numerical score readout */}
        <div className="radial-meter-center">
          <span
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              lineHeight: 1,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '0.125rem',
            }}
          >
            Risk Score
          </span>
        </div>
      </div>

      {/* High-contrast severity status badge */}
      <span
        className={`badge-risk ${
          severity === 'high'
            ? 'badge-risk-high'
            : severity === 'medium'
            ? 'badge-risk-medium'
            : 'badge-risk-low'
        }`}
      >
        {severity === 'high' && <AlertTriangleIcon size={13} />}
        {severity === 'medium' && <AlertCircleIcon size={13} />}
        {(severity === 'low' || severity === 'safe') && <CheckCircleIcon size={13} />}
        <span>{severityLabel}</span>
      </span>
    </div>
  );
}
