/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cs: {
          bg:       "#0B1220",
          surface:  "#111827",
          elevated: "#1F2937",
          border:   "#334155",
          primary:  "#6366F1",
          success:  "#22C55E",
          warning:  "#F59E0B",
          danger:   "#EF4444",
          text:     "#F8FAFC",
          muted:    "#94A3B8",
          subtle:   "#64748B",
        },
      },
      borderRadius: {
        xl2: "16px",
      },
    },
  },
  plugins: [],
};
