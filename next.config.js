const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/en/sitemap.xml',
        destination: '/sitemap.xml',
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
