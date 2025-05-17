/** @type {import('tailwindcss').Config} */
export default {
  content: ["./**/*.{html,js,jsx}"],
  darkMode: 'media',
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
