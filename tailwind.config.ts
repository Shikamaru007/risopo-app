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
        sans: ['"Google Sans"', 'Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        surface: '#f7f7f8',
        ink: '#0f172a',
        accent: '#2563eb'
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
