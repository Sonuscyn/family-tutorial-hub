/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FFFDF7", 100: "#FAF6F0", 200: "#F3ECDF" },
        butter: { DEFAULT: "#F7E7C4", dark: "#EFD59C", soft: "#FBF1D6" },
        wood: { DEFAULT: "#D4B896", dark: "#B89968", soft: "#E5D4B8" },
        ink: { DEFAULT: "#5B4636", soft: "#8A7560", muted: "#A89683" },
        miffy: { DEFAULT: "#F2A03D", dark: "#E08A2A", soft: "#FBE3C2" },
        sage: "#A8B89A",
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: { card: "1.5rem", pill: "9999px" },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(91,70,54,0.12)",
        card: "0 4px 18px -6px rgba(91,70,54,0.10)",
        lift: "0 12px 36px -10px rgba(91,70,54,0.18)",
      },
      maxWidth: { content: "1180px" },
    },
  },
  plugins: [],
};
