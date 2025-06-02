/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',  // Modern app directory structure (Next.js style)
    './components/**/*.{js,ts,jsx,tsx}',
    './*.html',
    './index.tsx'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // Indigo 600 color to match 0x1 theme
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b'
        },
        background: {
          light: '#fafafa',
          dark: '#0f0f23',
          'dark-secondary': '#1a1a2e',
          'dark-card': '#222236'
        },
        accent: {
          purple: '#a78bf6',
          'purple-dark': '#8b5cf6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  // No need for plugins as Tailwind v4 has many features built-in
  plugins: [],
}
