/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          border: 'var(--success-border)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          border: 'var(--warning-border)',
        },
        error: {
          DEFAULT: 'var(--error)',
          light: 'var(--error-light)',
          border: 'var(--error-border)',
        },
        info: {
          DEFAULT: 'var(--info)',
          light: 'var(--info-light)',
          border: 'var(--info-border)',
        },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}

