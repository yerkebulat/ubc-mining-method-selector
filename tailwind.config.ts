import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        mining: {
          50: '#f5f7fa',
          100: '#ebeef3',
          200: '#d2dae5',
          300: '#aab9ce',
          400: '#7c94b2',
          500: '#5c7699',
          600: '#485f7f',
          700: '#3b4d67',
          800: '#344256',
          900: '#2f3949',
          950: '#1f2530',
        },
      },
    },
  },
  plugins: [],
}
export default config
