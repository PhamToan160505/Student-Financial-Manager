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
          DEFAULT: '#2563EB', // blue-600 - Main primary blue for buttons, links, charts
          hover: '#1D4ED8',   // blue-700
          dark: '#1E40AF',    // blue-800 - Important text/icon blue
          light: '#EFF6FF',   // blue-50  - Subtle blue background
        },
        success: {
          DEFAULT: '#16A34A', // green-600 - Income
          light: '#F0FDF4',   // green-50
        },
        danger: {
          DEFAULT: '#DC2626', // red-600 - Budget alert / Expense warning
          light: '#FEF2F2',   // red-50
        },
        warning: {
          DEFAULT: '#F59E0B', // amber-500 - Budget warning (80-99%)
          light: '#FEF3C7',   // amber-100
        },
        neutral: {
          border: '#E5E7EB',  // gray-200 - Borders
          subtext: '#4B5563', // gray-600 - Secondary text
          maintext: '#111827',// gray-900 - Primary text (no pure black #000000)
          bg: '#F9FAFB',      // gray-50 - App background contrast against white cards
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
