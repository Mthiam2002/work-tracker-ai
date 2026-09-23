import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Silencieux sans DSN (dev local sans compte Sentry).
  silent: true,
  // Upload des sourcemaps uniquement si configuré (sinon build inchangé).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
