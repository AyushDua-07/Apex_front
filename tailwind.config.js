/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B3A5C',
        'navy-light': '#254d78',
        royal: '#2563EB',
        'royal-dark': '#1d4ed8',
        gold: '#F59E0B',
        'gold-dark': '#d97706',
      },
    },
  },
  plugins: [],
};
