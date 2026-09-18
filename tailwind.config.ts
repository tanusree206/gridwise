import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        grid: {
          bg: "#06080f",
          surface: "#0c111d",
          card: "#101727",
          border: "#1c2540",
          muted: "#8a93b2",
          text: "#e6ecff",
          accent: "#22d3a4",
          accentDim: "#0f8f6f",
          warn: "#f59e0b",
          danger: "#ef4444",
          info: "#60a5fa",
          violet: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34, 211, 164, 0.25), 0 8px 30px -10px rgba(34, 211, 164, 0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse at top, rgba(34,211,164,0.10), transparent 60%), radial-gradient(ellipse at bottom right, rgba(96,165,250,0.10), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
