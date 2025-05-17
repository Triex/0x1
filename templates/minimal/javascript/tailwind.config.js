/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app.js",
    "./src/**/*.{html,js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
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
