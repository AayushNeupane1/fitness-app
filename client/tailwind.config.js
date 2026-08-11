/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        zeon: {
          green: '#7ED957',
          black: '#0D0D0D',
        },
      },
    },
  },
  plugins: [],
};
