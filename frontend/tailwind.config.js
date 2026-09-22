/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#176B5B',
          hover: '#10594B',
          dark: '#0C463C',
          light: '#E8F3EF',
        },
        success: {
          DEFAULT: '#23845F',
          light: '#EAF6F0',
        },
        danger: {
          DEFAULT: '#C0524E',
          light: '#FAEEEC',
        },
        warning: {
          DEFAULT: '#D39A38',
          dark: '#98691C',
          darker: '#734C11',
          light: '#FBF2DD',
        },
        neutral: {
          border: '#DDE4DE',
          subtext: '#60716A',
          maintext: '#14231E',
          bg: '#F4F2EC',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px rgba(20, 35, 30, 0.04)',
        sm: '0 8px 24px rgba(20, 35, 30, 0.06)',
        md: '0 18px 45px rgba(20, 35, 30, 0.09)',
        lg: '0 28px 80px rgba(20, 35, 30, 0.14)',
      },
    },
  },
  plugins: [],
}
