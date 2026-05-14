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
        // Primary accent (single, restrained)
        accent: {
          DEFAULT: '#E25822',
          50: '#FDF1EA',
          100: '#FBE5DA',
          400: '#ED7144',
          500: '#E25822',
          600: '#C24A1E',
          700: '#B23E18',
        },
        // Backwards-compatible "boleto" alias → new accent
        boleto: {
          DEFAULT: '#E25822',
          light: '#ED7144',
          dim: '#C24A1E',
          glow: 'rgba(226, 88, 34, 0.15)',
        },
        // Marketing (light) neutrals
        paper: '#F8FAF9',
        ink: {
          900: '#0B1220',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
          500: '#4B5563',
          400: '#6B7280',
          300: '#9CA3AF',
          200: '#D1D5DB',
          150: '#E5E7EB',
          100: '#EEF0F2',
          75:  '#F1F3F5',
        },
        // App console (dark) — used by /events, /create-event, etc.
        bg: {
          primary:   '#0A0F1A',
          secondary: '#0F1626',
          card:      '#131C30',
        },
        border: {
          DEFAULT: '#1F2A44',
        },
        console: {
          bg:        '#0A0F1A',
          surface:   '#0F1626',
          card:      '#131C30',
          'card-hi': '#182343',
          line:      '#1F2A44',
          'line-hi': '#2B395C',
          text:      '#E8ECF3',
          dim:       '#8B95AB',
          mute:      '#5E6A85',
        },
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces', 'Source Serif 4', 'Georgia', 'serif'],
      },
      boxShadow: {
        boleto:      '0 1px 2px rgba(11,18,32,0.06), 0 4px 12px rgba(11,18,32,0.06)',
        'boleto-lg': '0 4px 8px rgba(11,18,32,0.06), 0 18px 40px rgba(11,18,32,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
