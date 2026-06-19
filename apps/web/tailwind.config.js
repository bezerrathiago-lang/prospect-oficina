/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F97316',
          gray: '#6B7280',
          dark: '#1F2937',
        },
      },
    },
  },
  plugins: [],
};
