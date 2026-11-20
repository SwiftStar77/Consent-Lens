import type { Metadata } from 'next';
import './globals.css';

/**
 * Global Root Metadata
 * Configures application title, description, and SEO properties.
 * Favicon and icons are automatically served via App Router convention (src/app/icon.png & src/app/favicon.ico).
 */
export const metadata: Metadata = {
  title: 'ConsentLens | Context-Aware Consent & Risk Auditor',
  description:
    'Context-aware digital consent, permission, and dark-pattern auditor. Evaluates agreements dynamically based on persona, app context, and risk tolerance.',
};

/**
 * Root Layout Component
 * Wraps all pages with Google Font preconnections and global styling.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for low-latency font rendering */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
