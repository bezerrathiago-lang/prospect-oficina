/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Identidade Cirne Motos
          red: '#E1251B', // vermelho vivo da marca (semicírculo / "MOTOS")
          graphite: '#4B4F54', // cinza grafite do "CIRNE"
          gray: '#6B7280',
          dark: '#2B2E33', // grafite escuro (fundo do login)
        },
      },
    },
  },
  plugins: [],
};
