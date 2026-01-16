/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        'primary-dark': '#6d28d9',
        background: '#0a0a0a',
      },
    },
  },
  plugins: [],
}
