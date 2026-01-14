/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  // Optimisations pour Vercel
  output: 'standalone', // Pour un build optimisé
  // Images optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
