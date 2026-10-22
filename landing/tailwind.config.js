/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'hsl(var(--ink))',
          raised: 'hsl(var(--ink-raised))',
          sunken: 'hsl(var(--ink-sunken))',
        },
        line: 'hsl(var(--line))',
        cream: {
          DEFAULT: 'hsl(var(--cream))',
          dim: 'hsl(var(--cream-dim))',
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          light: 'hsl(var(--brand-light))',
          dark: 'hsl(var(--brand-dark))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          light: 'hsl(var(--accent-light))',
        },
        signal: 'hsl(var(--signal))',
      },
      fontFamily: {
        display: ['Onest', 'system-ui', 'sans-serif'],
        sans: ['Onest', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      // Tailwind 3 não traz o degrau 4.5 por padrão; sem isso p-4.5/h-4.5 viram padding zero
      spacing: {
        4.5: '1.125rem',
      },
      maxWidth: {
        site: '76rem',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'screen-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'screen-in': 'screen-in 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
