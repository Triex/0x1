/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './*.html',
    './components/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}',
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
