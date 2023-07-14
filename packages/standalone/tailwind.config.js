/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        void: "#4A4A4A",
        electro: "#B380FF",
        pyro: "#FF9955",
        dendro: "#A5C83B",
        cryo: "#55DDFF",
        geo: "#FFCC00",
        hydro: "#3E99FF",
        anemo: "#80FFE6",
        omni: "#DCD4C2",
        energy: "#eab308"
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light"]
  }
}

