import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'InsureAI - Smart Insurance Platform',
    template: '%s | InsureAI',
  },
  description:
    'AI-powered insurance platform that provides instant quotes, hassle-free claims processing, and personalized policy management. Get covered in minutes, not days.',
  keywords: [
    'insurance',
    'AI insurance',
    'auto insurance',
    'home insurance',
    'life insurance',
    'health insurance',
    'claims',
    'quotes',
    'policy management',
  ],
  authors: [{ name: 'InsureAI Team' }],
  creator: 'InsureAI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://insureai.com',
    siteName: 'InsureAI',
    title: 'InsureAI - Smart Insurance Platform',
    description:
      'Get AI-powered insurance quotes, manage policies, and file claims instantly.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'InsureAI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsureAI - Smart Insurance Platform',
    description:
      'Get AI-powered insurance quotes, manage policies, and file claims instantly.',
    images: ['/og-image.png'],
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
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div id="root" className="relative min-h-screen">
          {children}
        </div>
        <div id="modal-root" />
        <div id="toast-root" />
      </body>
    </html>
  );
}
