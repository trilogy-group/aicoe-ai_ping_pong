/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        openai: "#0081FB",
        grok: "#00D06C",
        claude: "#7C3AED",
      },
    },
  },
  plugins: [],
};
