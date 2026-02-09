/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['localhost', 'bbwabdiddlgxtkzluxar.supabase.co'],
    },
    // Disable static indicator in development
    devIndicators: {
        buildActivity: false,
        buildActivityPosition: 'bottom-right',
    },
    // Optimize for faster builds
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion'],
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    serverExternalPackages: ['pdf-parse'],
}

module.exports = nextConfig
