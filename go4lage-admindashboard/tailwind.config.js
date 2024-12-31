/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: 'var(--color-brand)',
        'brand-secondary': 'var(--color-brand-secondary)',
        
        // Text colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        
        // Surface/Background colors
        surface: {
          primary: 'var(--color-surface-primary)',    // Main background
          secondary: 'var(--color-surface-secondary)', // Secondary background
          tertiary: 'var(--color-surface-tertiary)',  // Third level background
          inverse: 'var(--color-surface-inverse)',    // Inverse background
        },
        
        // Accent colors for emphasis
        accent: {
          primary: 'var(--color-accent-primary)',
          secondary: 'var(--color-accent-secondary)',
        },
        
        // Semantic colors
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        
        // Border colors
        border: {
          default: 'var(--color-border)',
          muted: 'var(--color-border-muted)',
        },
        
        // Interactive element colors
        interactive: {
          default: 'var(--color-interactive)',
          hover: 'var(--color-interactive-hover)',
          active: 'var(--color-interactive-active)',
          disabled: 'var(--color-interactive-disabled)',
        },
      },
      
      // Gradients
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-surface': 'var(--gradient-surface)',
      },
    },
  },
  plugins: [],
}

export default config