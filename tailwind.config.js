/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-container-highest": "#dce5d7",
        "surface-dim": "#d3ddcf",
        "on-tertiary-fixed": "#221b00",
        "on-tertiary-container": "#4d4000",
        "on-primary-container": "#004c1b",
        "on-tertiary-fixed-variant": "#544600",
        "on-secondary-fixed": "#002115",
        "surface-tint": "#006e2a",
        "surface-container-low": "#edf6e8",
        "primary": "#006e2a",
        "tertiary-fixed": "#ffe16d",
        "outline": "#6c7b6a",
        "on-tertiary": "#ffffff",
        "on-error": "#ffffff",
        "on-surface": "#151e15",
        "on-secondary-fixed-variant": "#00513a",
        "error": "#ba1a1a",
        "secondary": "#1b6b50",
        "on-primary-fixed": "#002108",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#e7f1e3",
        "primary-fixed": "#69ff87",
        "background": "#f3fcee",
        "inverse-surface": "#2a3329",
        "inverse-primary": "#3ce36a",
        "error-container": "#ffdad6",
        "tertiary-fixed-dim": "#e9c400",
        "on-background": "#151e15",
        "secondary-fixed-dim": "#8bd6b4",
        "surface-container-high": "#e1ebdd",
        "on-primary": "#ffffff",
        "surface-variant": "#dce5d7",
        "on-primary-fixed-variant": "#00531e",
        "secondary-fixed": "#a6f2d0",
        "primary-fixed-dim": "#3ce36a",
        "inverse-on-surface": "#eaf4e5",
        "on-secondary": "#ffffff",
        "surface-bright": "#f3fcee",
        "on-error-container": "#93000a",
        "tertiary": "#705d00",
        "primary-container": "#00c853",
        "outline-variant": "#bbcbb8",
        "surface": "#f3fcee",
        "on-surface-variant": "#3c4a3c",
        "secondary-container": "#a3efcd",
        "on-secondary-container": "#216f54",
        "tertiary-container": "#cbab00"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        sm: "12px",
        base: "8px",
        lg: "48px",
        "container-max": "1280px",
        xs: "4px",
        xl: "80px",
        md: "24px",
        gutter: "24px"
      },
      fontFamily: {
        sans: ["var(--font-prompt)", "sans-serif"],
        "headline-sm": ["var(--font-prompt)", "sans-serif"],
        "headline-md": ["var(--font-prompt)", "sans-serif"],
        "label-sm": ["var(--font-prompt)", "sans-serif"],
        "body-sm": ["var(--font-prompt)", "sans-serif"],
        "body-md": ["var(--font-prompt)", "sans-serif"],
        "headline-lg": ["var(--font-prompt)", "sans-serif"],
        "headline-xl": ["var(--font-prompt)", "sans-serif"],
        "body-lg": ["var(--font-prompt)", "sans-serif"],
        "headline-xl-mobile": ["var(--font-prompt)", "sans-serif"]
      },
      fontSize: {
        "headline-sm": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "headline-xl": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-xl-mobile": ["32px", { lineHeight: "40px", fontWeight: "700" }]
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'text-shimmer': 'text-shimmer 2.5s ease-out infinite alternate',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        "text-shimmer": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      }
    }
  }
};
