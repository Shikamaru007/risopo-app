import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem'
    },
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', 'system-ui', 'sans-serif']
      },
      colors: {
        surface: '#fafafa',
        ink: '#0f172a',
        accent: '#141B34'
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
