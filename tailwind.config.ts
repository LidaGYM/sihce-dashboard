import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sihce: {
          green: "#1a9c4b",
          yellow: "#f4c400",
          blue: "#1d4ed8",
          header: "#2f5fa8",
          title: "#0b5cad",
          button: "#4472c4",
          navy: "#0f1f3d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
