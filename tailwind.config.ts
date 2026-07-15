import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        egoffgreen: "#0a2218",
        egoffgreendeep: "#051a0f",
        egoffgold: "#c9a848",
        egoffgoldwarm: "#b7791f",
      },
      fontFamily: {
        cinzel: ["var(--font-cinzel)"],
        cormorant: ["var(--font-cormorant)"],
        lato: ["var(--font-lato)"],
      },
    },
  },
  plugins: [],
};
export default config;
