/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@wataomi/ui', '@wataomi/types'],
    images: {
        domains: ['localhost'],
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
