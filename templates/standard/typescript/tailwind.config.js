/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './src/**/*.{html,js,ts,jsx,tsx}',
    './styles/**/*.css'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0077cc',
          dark: '#005fa3',
          light: '#3399dd'
        }
      }
    },
  },
  plugins: [],
}
