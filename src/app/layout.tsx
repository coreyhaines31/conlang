import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conlang - Construct Your Language",
  description: "Build constructed languages with instant feedback. Define sounds, create words, and bring your language to life.",
  metadataBase: new URL('https://conlang.app'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/conlang-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    title: 'Conlang - Construct Your Language',
    description: 'Build constructed languages with instant feedback. Define sounds, create words, and bring your language to life.',
    url: 'https://conlang.app',
    siteName: 'Conlang',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Conlang - Build constructed languages',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conlang - Construct Your Language',
    description: 'Build constructed languages with instant feedback.',
    images: ['/og-image.svg'],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="BALMNPTU"
          defer
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
