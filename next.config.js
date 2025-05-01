/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'habit.localhost' }],
        destination: '/habit-tracker',
        permanent: false,
      },
    ];
  },
  // No experimental features needed
  async rewrites() {
    return [
      {
        source: '/habit-tracker/:path*',
        has: [
          { type: 'host', value: 'habit.localhost' }
        ],
        destination: '/habit-tracker/:path*'
      },
      {
        source: '/habit-marathon/:path*',
        has: [
          { type: 'host', value: 'habit.localhost' }
        ],
        destination: '/habit-marathon/:path*'
      }
    ];
  }
}
module.exports = nextConfig 