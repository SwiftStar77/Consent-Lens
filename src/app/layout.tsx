import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ConsentLens | Context-Aware Consent & Risk Copilot',
  description:
    'Context-aware digital consent, permission, and dark-pattern copilot. Evaluates agreements dynamically based on persona, app context, and risk tolerance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
