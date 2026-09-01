/**
 * Security headers safe to ship without knowing the final hosting/CDN or
 * third-party script sources yet (Phase 3A, Lane 1 —
 * PRODUCTION_READINESS_CHECKLIST.md "Add next.config.js security
 * headers"). Deliberately NOT included: Content-Security-Policy and
 * Strict-Transport-Security. CSP needs real tuning once actual third-party
 * script/style/connect sources are known (a wrong CSP silently breaks
 * pages rather than failing loudly); HSTS should be set at the
 * load-balancer/CDN layer once a hosting provider is chosen (Lane 4) —
 * setting it here in a build that isn't guaranteed to be served over TLS
 * yet is the kind of "irreversible-feeling" header a browser will cache
 * for a long time. Both are called out as open items in
 * SECURITY_ARCHITECTURE.md, not silently skipped.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

module.exports = nextConfig;
