/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/react-native-tailwindcss/**/*.js',
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        JCharted: ['JCharted'],
      },
      colors: {
        primary: {
          pBlue: "#1E91D6",
          sBlue: "#0072BB",
          green: "#8FC93A",
          yellow: "#E4CC37",
          orange: "#E18335",
        },
      },
    },
  },
  plugins: [],
}