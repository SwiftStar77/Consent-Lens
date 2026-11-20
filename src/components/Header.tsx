'use client';

import React from 'react';
import { SAMPLE_SCENARIOS } from '@/lib/samples';
import { ScenarioSample } from '@/lib/types';
import { ShieldIcon, FileTextIcon } from './Icons';

interface HeaderProps {
  onSelectScenario: (scenario: ScenarioSample) => void;
  selectedScenarioId: string | null;
}

export function Header({ onSelectScenario, selectedScenarioId }: HeaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = SAMPLE_SCENARIOS.find((s) => s.id === e.target.value);
    if (found) {
      onSelectScenario(found);
    }
  };

  return (
    <header
      role="banner"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-stone)',
        padding: '0.875rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--accent-surface)',
              color: 'var(--accent-primary)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.125rem' }}>ConsentLens</h1>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.375rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-stone)',
                  textTransform: 'uppercase',
                }}
              >
                Copilot
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.3,
              }}
            >
              Context-aware digital consent, permission, and dark-pattern evaluator
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <label
            htmlFor="scenario-loader"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <FileTextIcon size={15} />
            <span>Load Sample Scenario:</span>
          </label>
          <select
            id="scenario-loader"
            className="form-select"
            style={{ width: 'auto', minWidth: '220px' }}
            value={selectedScenarioId || ''}
            onChange={handleChange}
            aria-label="Load a realistic sample scenario"
          >
            <option value="" disabled>
              Select sample scenario...
            </option>
            {SAMPLE_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
