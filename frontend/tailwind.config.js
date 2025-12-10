/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crisis: {
          red: '#DC2626',
          orange: '#EA580C',
          yellow: '#D97706',
          green: '#059669',
          blue: '#2563EB',
        }
      }
    },
  },
  plugins: [],
}
