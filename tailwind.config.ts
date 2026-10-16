import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './frontend/src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        primary: '#7c3aed',
        'primary-dark': '#6d28d9',
      },
    },
  },
  plugins: [],
};

export default config;
