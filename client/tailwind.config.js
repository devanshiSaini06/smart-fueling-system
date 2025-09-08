/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // 👈 this enables dark mode via a "dark" class on <html>
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // scan all your React files for Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};


