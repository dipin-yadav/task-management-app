/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. 
 * On 3GB RAM, we definitely want to skip this during the build phase.
 */
if (process.env.SKIP_ENV_VALIDATION !== "true") {
  await import("./src/env.js");
}

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  
  // 1. Disable Type Checking & Linting (HUGE RAM SAVINGS)
  // Your 2-core CPU will choke trying to do this and bundle at the same time.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  transpilePackages: ["geist"],

  // 2. Reduce the bundling footprint
  experimental: {
    // Prevents Next.js from trying to build multiple things in parallel
    // which spikes RAM usage immediately.
    parallelServerBuildTraces: false,
    parallelServerCompiles: false,
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

export default config;
