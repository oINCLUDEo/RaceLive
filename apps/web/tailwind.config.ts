import type { Config } from "tailwindcss";

// Дизайн-система «Оксид». Токены-источник — в app/globals.css (OKLCH).
// Здесь только проекция CSS-переменных в утилиты Tailwind.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
        },
        line: "var(--line)",
        bone: "var(--bone)",
        mute: "var(--mute)",
        disabled: "var(--disabled)",
        // функциональные — только для данных
        purple: "var(--purple)",
        green: "var(--green)",
        yellow: "var(--yellow)",
        red: "var(--red)",
        blue: "var(--blue)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // скругления кодируют иерархию
        data: "0",
        control: "4px",
        overlay: "8px",
      },
      maxWidth: {
        prose: "72ch",
      },
    },
  },
  plugins: [],
};

export default config;
