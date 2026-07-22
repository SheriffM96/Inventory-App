import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf6ec",
          100: "#f8e8c8",
          200: "#f0d090",
          300: "#e6b158",
          400: "#d99633",
          500: "#c17d24",
          600: "#9c611c",
          700: "#7a4b18",
          800: "#5c3813",
          900: "#3d260d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
