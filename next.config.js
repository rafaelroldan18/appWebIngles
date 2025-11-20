/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [],
  },

  // 🔧 Desactivar Turbopack en Next.js 16
  experimental: {
    turbo: {
      enabled: false,
    },
  },

  // 🔧 Asegurar que Webpack se use como compilador
  webpack(config) {
    return config;
  },
};

module.exports = nextConfig;
