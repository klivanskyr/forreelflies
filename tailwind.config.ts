import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/Components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        greenPrimary: "var(--greenPrimary)",
      },
      boxShadow: {
        "card": "0 2px 50px 15px rgba(0, 0, 0, 0.025)",
        "input": "0 4px 20px 0 rgba(0, 0, 0, 0.025)",
      },
    },
  },
  plugins: [],
};
export default config;
