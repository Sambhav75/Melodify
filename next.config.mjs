/** @type {import('next').NextConfig} */

// Allow next/image to optimise files served from your Supabase Storage bucket.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
  } catch {
    return null
  }
})()

const remotePatterns = [
  { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/v1/object/public/**' },
  { protocol: 'http', hostname: '127.0.0.1', port: '54321', pathname: '/storage/v1/object/public/**' },
]

if (supabaseHost && !supabaseHost.endsWith('.supabase.co') && supabaseHost !== '127.0.0.1') {
  remotePatterns.push({ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' })
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Set NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION=true if you hit Vercel's free image-optimisation quota.
    unoptimized: process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === 'true',
    remotePatterns,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
