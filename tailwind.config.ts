import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b0506",      // near-black page background
        coal: "#150c0e",     // raised surface
        wine: "#2a0e13",     // deep burgundy surface
        crimson: "#8e1b21",  // primary red (buttons, accents)
        ember: "#b3232a",    // brighter red highlight
        cream: "#f3e9d4",    // warm ivory typography
        sand: "#cdbb97",     // muted cream / secondary text
        gold: "#c9a24b",     // thin gold details
        clay: "#7a6a58",     // muted body text on dark
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.32em",
      },
      boxShadow: {
        book: "0 24px 60px -18px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.5)",
        lift: "0 18px 44px -12px rgba(142,27,33,0.35), 0 10px 30px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-10px,0)" },
        },
        "slow-pan": {
          "0%": { transform: "scale(1.05) translateX(0)" },
          "100%": { transform: "scale(1.05) translateX(-2%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.9s ease both",
        drift: "drift 9s ease-in-out infinite",
        "slow-pan": "slow-pan 26s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
