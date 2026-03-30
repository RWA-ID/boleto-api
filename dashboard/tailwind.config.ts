import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        boleto: {
          DEFAULT: '#f97316',   // orange-500
          light: '#fb923c',     // orange-400
          dim: '#431407',
          glow: 'rgba(249, 115, 22, 0.15)',
        },
        bg: {
          primary: '#0a0a0a',
          secondary: '#111111',
          card: '#161616',
        },
        border: {
          DEFAULT: '#1f1f1f',
        },
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
      boxShadow: {
        boleto: '0 0 20px rgba(249, 115, 22, 0.25)',
        'boleto-lg': '0 0 40px rgba(249, 115, 22, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
