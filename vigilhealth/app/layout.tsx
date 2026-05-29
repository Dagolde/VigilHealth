import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { AuthProvider } from '@/components/providers/AuthProvider';
import { OfflineSyncProvider } from '@/components/providers/OfflineSyncProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'VigilHealth — Hyperlocal Health Intelligence',
    template: '%s | VigilHealth',
  },
  description:
    'Real-time community health risk mapping, symptom checking, supply finding, and mutual aid coordination for your neighborhood.',
  keywords: [
    'health',
    'community',
    'risk map',
    'symptom checker',
    'supply finder',
    'mutual aid',
    'outbreak',
    'public health',
  ],
  authors: [{ name: 'VigilHealth' }],
  creator: 'VigilHealth',
  publisher: 'VigilHealth',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.com'
  ),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://vigilhealth.com',
    siteName: 'VigilHealth',
    title: 'VigilHealth — Hyperlocal Health Intelligence',
    description:
      'Real-time community health risk mapping, symptom checking, supply finding, and mutual aid coordination for your neighborhood.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VigilHealth — Hyperlocal Health Intelligence',
    description:
      'Real-time community health risk mapping, symptom checking, supply finding, and mutual aid coordination for your neighborhood.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VigilHealth',
  },
  formatDetection: {
    telephone: false,
  },
};

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#22c55e' },
    { media: '(prefers-color-scheme: dark)', color: '#15803d' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to external services for performance */}
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link rel="preconnect" href="https://tiles.mapbox.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* Main application content */}
        <AuthProvider>
          <OfflineSyncProvider>
            <div id="app-root">{children}</div>
          </OfflineSyncProvider>
        </AuthProvider>

        {/* Accessibility: skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to main content
        </a>
      </body>
    </html>
  );
}
