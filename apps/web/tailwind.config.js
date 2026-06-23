/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#DC2626',
          gray: '#6B7280',
          dark: '#1F2937',
        },
      },
    },
  },
  plugins: [],
};
