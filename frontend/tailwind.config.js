module.exports = {
	purge: ["./src/**/*.{ts,tsx,js,jsx,html}"],
	darkMode: false,
	theme: {
		extend: {},
	},
	daisyui: {
		themes: ["luxury"],
	},
	variants: {},
	plugins: [
		require("@tailwindcss/forms"),
		require("@tailwindcss/typography"),
		require("daisyui"),
	],
};
