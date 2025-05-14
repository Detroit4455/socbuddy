/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure dynamic routes that use API features
  output: 'standalone',
  
  // Define routes that can't be statically optimized
  experimental: {
    missingSuspenseWithCSRBailout: false,  // Disable CSR bailout warning
  },
  
  // Disable static generation for API routes that use headers
  excludeDefaultMomentLocales: true,
  
  // Configure output export settings
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
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