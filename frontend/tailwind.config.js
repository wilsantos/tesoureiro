/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#211E70',
          dark: '#181556',
          light: '#2e2a8a',
        },
        accent: {
          DEFAULT: '#F9E423',
          dark: '#dfc91f',
          foreground: '#211E70',
        },
        surface: {
          DEFAULT: '#FEFEFE',
          muted: '#f5f5fa',
          border: '#e4e4ef',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
