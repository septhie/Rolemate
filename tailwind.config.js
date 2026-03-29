/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#F8FAFC",
        paper: "#050505",
        coral: "#F97316",
        teal: "#22D3EE",
        moss: "#4ADE80",
        sand: "#A5B4FC",
        slate: "#94A3B8",
        navy: "#020617"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(0, 0, 0, 0.35)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "hero-mesh": "radial-gradient(circle at top left, rgba(79,70,229,0.18), transparent 36%), radial-gradient(circle at top right, rgba(109,40,217,0.16), transparent 34%), linear-gradient(180deg, #050505 0%, #000000 100%)"
      }
    }
  },
  plugins: []
};
