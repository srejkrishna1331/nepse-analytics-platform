/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiGateway = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const marketDataUrl = process.env.MARKET_DATA_URL || '';
    const rewrites = [
      {
        source: '/api/:path*',
        destination: `${apiGateway}/api/:path*`,
      },
    ];
    // When running without API Gateway, route /api/market/* directly to the market-data service
    if (marketDataUrl) {
      rewrites.unshift({
        source: '/api/market/:path*',
        destination: `${marketDataUrl}/api/:path*`,
      });
    }
    return rewrites;
  },
};

module.exports = nextConfig;
