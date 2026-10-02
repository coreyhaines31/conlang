import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP for app routes. We can't drop 'unsafe-inline' from script execution
// today because Next.js 16 emits inline bootstrap scripts without a nonce
// (would require middleware-driven nonces). But we can still block inline
// event-handler ATTRIBUTES with `script-src-attr 'none'`, which is the
// key defense-in-depth against an HTML-injection sanitizer bypass: even
// if a malicious on*= attribute reaches the DOM, modern browsers refuse
// to fire it. 'unsafe-inline' for style is required by Tailwind v4 +
// Radix UI runtime styling. React needs eval() in development only.
const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devEval} https://cdn.usefathom.com`,
  "script-src-elem 'self' 'unsafe-inline' https://cdn.usefathom.com",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.usefathom.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cdn.usefathom.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: NextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Image optimization settings
  images: {
    // Project no longer uses Supabase storage. Keep the remotePatterns list
    // empty so the Image Optimizer cannot be used as an open SSRF proxy.
    remotePatterns: [],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },

  // Redirects (if needed in the future)
  async redirects() {
    return [
      // Example: redirect www to non-www
      // {
      //   source: '/:path*',
      //   has: [{ type: 'host', value: 'www.conlang.app' }],
      //   destination: 'https://conlang.app/:path*',
      //   permanent: true,
      // },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "coreys-apps",
  project: "conlang",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
