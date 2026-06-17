/** @type {import('tailwindcss').Config} */

// Token channels are stored as raw "H S% L%" triples on CSS custom properties so
// Tailwind can inject the <alpha-value> placeholder and opacity utilities keep working.
const ch = (v) => `hsl(var(${v}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: ch('--bg'),
        'surface-1': ch('--surface-1'),
        'surface-2': ch('--surface-2'),
        'surface-3': ch('--surface-3'),
        'surface-inset': ch('--surface-inset'),
        border: ch('--border'),
        'border-strong': ch('--border-strong'),
        'border-subtle': ch('--border-subtle'),
        text: {
          primary: ch('--text-primary'),
          secondary: ch('--text-secondary'),
          muted: ch('--text-muted'),
          faint: ch('--text-faint'),
        },
        cyan: { DEFAULT: ch('--accent-cyan'), dim: ch('--accent-cyan-dim') },
        emerald: { DEFAULT: ch('--accent-emerald'), dim: ch('--accent-emerald-dim') },
        crimson: { DEFAULT: ch('--accent-crimson'), dim: ch('--accent-crimson-dim') },
        amber: { DEFAULT: ch('--accent-amber'), dim: ch('--accent-amber-dim') },
        ring: ch('--ring'),
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
        serif: 'var(--font-serif)',
      },
      fontSize: {
        label: ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 0 0 hsl(var(--border) / 0.5), 0 8px 24px -12px hsl(var(--shadow-color) / 0.7)',
        raised:
          '0 1px 0 0 hsl(var(--border-strong) / 0.4), 0 16px 40px -16px hsl(var(--shadow-color) / 0.8)',
        key: 'inset 0 1px 0 0 hsl(0 0% 100% / 0.06), 0 2px 0 0 hsl(var(--shadow-color) / 0.9), 0 6px 12px -6px hsl(var(--shadow-color) / 0.6)',
        'key-pressed': 'inset 0 2px 4px 0 hsl(var(--shadow-color) / 0.8)',
      },
      borderColor: {
        DEFAULT: ch('--border'),
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'caret-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'caret-blink': 'caret-blink 1.05s steps(1) infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
