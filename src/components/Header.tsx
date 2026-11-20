'use client';

import React from 'react';
import { ShieldIcon } from './Icons';

interface HeaderProps {
  onResetToHome?: () => void;
}

export function Header({ onResetToHome }: HeaderProps) {
  return (
    <header
      role="banner"
      style={{
        backgroundColor: 'transparent',
        padding: '1.5rem 1rem 0.5rem 1rem',
      }}
    >
      <div
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={onResetToHome}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            background: 'none',
            border: 'none',
            cursor: onResetToHome ? 'pointer' : 'default',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            textAlign: 'left',
          }}
          title="ConsentLens Home"
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'var(--accent-tint)',
              color: 'var(--accent-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent-tint-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-subtle)',
              flexShrink: 0,
            }}
          >
            <ShieldIcon size={20} />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                display: 'block',
              }}
            >
              ConsentLens
            </span>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Context-aware consent & dark-pattern auditor
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
