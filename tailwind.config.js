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
        ink: "#10212A",
        paper: "#F6F1E8",
        coral: "#EE6C4D",
        teal: "#1B7F8B",
        moss: "#5F7A61",
        sand: "#E7D8BF",
        slate: "#5A6473",
        navy: "#17324A"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(16, 33, 42, 0.12)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "hero-mesh": "radial-gradient(circle at top left, rgba(238,108,77,0.18), transparent 36%), radial-gradient(circle at top right, rgba(27,127,139,0.14), transparent 34%), linear-gradient(135deg, #F6F1E8 0%, #FFFDF8 48%, #F5E7D1 100%)"
      }
    }
  },
  plugins: []
};

