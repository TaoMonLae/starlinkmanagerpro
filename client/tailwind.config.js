export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#111111",
        line: "#dedbd6",
        brand: "#ff5600",
        cream: "#faf9f6",
        oat: "#dedbd6",
        muted: "#7b7b78",
        mint: "#10B981",
        amber: "#F59E0B",
        rose: "#F43F5E",
        reportBlue: "#65b5ff",
        reportGreen: "#0bdf50",
        reportPink: "#ff2067",
        reportLime: "#b3e01c"
      },
      boxShadow: {
        soft: "none"
      }
    }
  },
  plugins: []
};
