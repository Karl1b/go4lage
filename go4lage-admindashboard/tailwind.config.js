/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'rgba(154, 154, 255, <alpha-value>)',
        'gradient-start': 'rgba(255, 196, 4, <alpha-value>)',
        'gradient-end': 'rgba(255, 119, 0, <alpha-value>)',
        primary: 'rgba(0, 0, 0, 1)',
        secondary: 'rgba(112, 112, 112, <alpha-value>)',
        tertiary: 'rgba(215, 215, 215, <alpha-value>)',
        pink:'#aa0069',
        secondheader: '#2c3e50',
        header:'#3b93d',
        
      },
      backgroundColor: {
        primary: '#073fb9',
        secondary: '#8e8e8e', // '#6d6d6d',
        section: '#f4f4f4',
        light:'#bdbdbd',
        highlight: 'rgba(240,230 , 190, <alpha-value>)',
        pink:'#aa0069',
        darkblue:'#28527a',
        header:'#3b93d1',
      },
      backgroundImage: {
        'gradient-custom': 'linear-gradient(-30deg, #4fcbe0, #329dab, #28527a, #1b4965)',
      },
    },
  },
  plugins: [],
}

export default config