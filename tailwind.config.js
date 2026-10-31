/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#086288',    // Deep Ocean Blue (Chính)
          blue: '#4D8DBA',    // Medium Ocean (Phụ)
          sky: '#97D7FF',     // Light Sky (Highlight / Accent)
          cream: '#FFEFC4',   // Warm Cream (Badge / Nền ấm)
        }
      }
    },
  },
  plugins: [],
}
