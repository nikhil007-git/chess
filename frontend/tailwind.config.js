/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#0f172a',      // Slate 900
          navy: '#1e293b',      // Slate 800
          surface: '#182234',   // Custom card surface
          card: '#1e293b',
          border: '#334155',    // Slate 700
          gold: '#eab308',      // Yellow 500
          goldLight: '#facc15', // Yellow 400
          goldDark: '#ca8a04',  // Yellow 600
          textMuted: '#94a3b8'  // Slate 400
        }
      }
    },
  },
  plugins: [],
}

