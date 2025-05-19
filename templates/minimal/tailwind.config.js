/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './*.html',
    './app/**/*.{html,js,ts,jsx,tsx}',  // Include app directory files
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
