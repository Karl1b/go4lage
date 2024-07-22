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
          pink:'#690069'
        },
        backgroundColor: {
          primary: '#073fb9',
          secondary: '#adadad', // '#6d6d6d',
          section: '#d0d0d0',
          highlight: 'rgba(240,230 , 190, <alpha-value>)',
          pink:'#690069'
        },
      },
    },
    plugins: [],
  }
  
  export default config
  