/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0a101f',
        'brand-blue': '#00ffff',
        'brand-light-blue': '#7df9ff',
        'brand-purple': '#3a2d7f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(0, 255, 255, 0.4), 0 0 5px rgba(0, 255, 255, 0.6)',
        'glow-blue-sm': '0 0 8px rgba(0, 255, 255, 0.4), 0 0 3px rgba(0, 255, 255, 0.6)',
      }
    },
  },
  plugins: [],
}
