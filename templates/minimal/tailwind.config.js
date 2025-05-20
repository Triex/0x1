/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './index.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{html,js,ts,jsx,tsx}',  // Include app directory files
    './styles/**/*.css'
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
        }
      }
    },
  },
  // No need for plugins as Tailwind v4 has many features built-in
  plugins: [],
}
