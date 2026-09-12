/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'agri-green': '#2ecc71',
        'agri-dark': '#27ae60',
      }
    },
  },
  plugins: [],
}