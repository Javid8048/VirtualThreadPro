/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#080a0f',
          900: '#0f1219',
          850: '#151922',
          800: '#1b202c',
          700: '#272e3f',
          600: '#3a445d',
          500: '#526083',
          400: '#7987a9',
          300: '#a3b0cc',
          200: '#ccd5e7',
          100: '#f0f3fa'
        },
        brand: {
          500: '#4258d8',
          600: '#3548b8',
          700: '#2b3994',
          accent: '#00f0ff'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(66, 88, 216, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(0, 240, 255, 0.4)'
      }
    },
  },
  plugins: [],
}
