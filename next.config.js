/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://staging-static.tinytap.it;",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig