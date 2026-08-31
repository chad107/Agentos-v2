import type { Config } from "tailwindcss";

// AgentOS design tokens: professional operations software, not sci-fi AI chrome.
// Calm, readable, dense-enough-for-work palette. See BUILD_STATUS.md for rationale.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#b8d0ff",
          300: "#8ab0ff",
          400: "#5c8bff",
          500: "#3667f0",
          600: "#264cd1",
          700: "#1f3ca8",
          800: "#1c3486",
          900: "#1a2f6e"
        },
        surface: {
          DEFAULT: "#ffffff",
          subtle: "#f7f8fb",
          muted: "#eef0f5",
          border: "#e2e5ec"
        },
        ink: {
          900: "#111521",
          700: "#2c3244",
          500: "#5b6273",
          400: "#7a8194"
        },
        status: {
          safe: "#1f8a4c",
          safeBg: "#e7f6ec",
          attention: "#b6720a",
          attentionBg: "#fdf1dd",
          urgent: "#b3261e",
          urgentBg: "#fbe9e8",
          info: "#2360c9",
          infoBg: "#e9f0fd"
        }
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ]
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(17, 21, 33, 0.06), 0 1px 3px 0 rgba(17, 21, 33, 0.08)",
        popover: "0 8px 24px -4px rgba(17, 21, 33, 0.18)"
      },
      borderRadius: {
        card: "0.75rem"
      }
    }
  },
  plugins: []
};

export default config;
