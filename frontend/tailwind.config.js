/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'slate-500': '#64748B',
        'slate-600': '#475569',
        'slate-200': '#E2E8F0',
      },
    },
  },
  plugins: [],
}
