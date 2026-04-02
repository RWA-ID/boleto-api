/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for IPFS hosting on boleto.eth
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  eslint:     { ignoreDuringBuilds: true },
  trailingSlash: true,
  images: {
    unoptimized: true, // required for static export
  },
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    const path = require('path')
    config.resolve.fallback = { fs: false, net: false, tls: false }
    const valtioRoot = path.resolve(__dirname, '../node_modules/valtio')
    config.resolve.alias = {
      ...config.resolve.alias,
      'valtio': path.join(valtioRoot, 'index.js'),
      'valtio/vanilla': path.join(valtioRoot, 'vanilla.js'),
      'valtio/react': path.join(valtioRoot, 'react.js'),
      'valtio/utils': path.join(valtioRoot, 'utils.js'),
    }
    // NormalModuleReplacementPlugin handles subpath aliases more reliably than resolve.alias
    // for packages coming from outside the Next.js project root
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^valtio\/vanilla\/utils$/,
        path.join(valtioRoot, 'vanilla/utils.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^valtio\/vanilla$/,
        path.join(valtioRoot, 'vanilla.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^valtio\/utils$/,
        path.join(valtioRoot, 'utils.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^valtio\/react$/,
        path.join(valtioRoot, 'react.js')
      ),
    )
    return config
  },
}

module.exports = nextConfig
