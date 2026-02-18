/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ud: {
          red: '#C8102E',
          dark: '#1a1a2e',
          navy: '#16213e',
          blue: '#0f3460',
          accent: '#e94560',
          light: '#f8f9fa',
        },
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
