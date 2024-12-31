export const themes = {
  light: {
    // Brand
    '--color-brand': '#2c5dcd', // Using your primary color
    '--color-brand-secondary': '#3b93d1', // Using your header color

    // Text
    '--color-text-primary': '#333', // Using your text color
    '--color-text-secondary': '#2c3e50', // Using your secondary color
    '--color-text-muted': '#667788', // Derived from secondary
    '--color-text-inverse': '#ffffff', // Keep white for contrast

    // Surfaces
    '--color-surface-primary': '#e4e4e4', // Using your background color
    '--color-surface-secondary': '#d8d8d8', // Slightly darker than primary
    '--color-surface-tertiary': '#dddddd', // Even darker for depth
    '--color-surface-inverse': '#2c3e50', // Using secondary color

    // Accents
    '--color-accent-primary': '#2c5dcd', // Match brand
    '--color-accent-secondary': '#3b93d1', // Match brand secondary

    // Semantic (keeping these as they're well chosen)
    '--color-success': '#16a34a',
    '--color-warning': '#ca8a04',
    '--color-error': '#dc2626',
    '--color-info': '#3b93d1', // Using your header color

    // Borders
    '--color-border': '#dddddd',
    '--color-border-muted': '#e8e8e8',

    // Interactive
    '--color-interactive': '#4f7fff', // Match brand
    '--color-interactive-hover': '#2449a3', // Darker brand
    '--color-interactive-active': '#1c3879', // Even darker
    '--color-interactive-disabled': '#a3b3c6', // Muted brand

    // Gradients (keeping structure)
    '--gradient-brand':
      'linear-gradient(to right, var(--color-brand), var(--color-brand-secondary))',
    '--gradient-surface':
      'linear-gradient(to bottom, var(--color-surface-primary), var(--color-surface-secondary))',
  },
  dark: {
    // Brand (keeping consistent with light theme)
    '--color-brand': '#2c5dcd',
    '--color-brand-secondary': '#3b93d1',

    // Text
    '--color-text-primary': '#f4f4f4', // Light gray for readability
    '--color-text-secondary': '#d1d8e0', // Slightly dimmed
    '--color-text-muted': '#9ba9b9', // Further muted
    '--color-text-inverse': '#2c3e50', // Dark for contrast

    // Surfaces
    '--color-surface-primary': '#1a1f2c', // Dark blue-gray
    '--color-surface-secondary': '#141922', // Darker
    '--color-surface-tertiary': '#252d3b', // Slightly lighter
    '--color-surface-inverse': '#f4f4f4', // Light for contrast

    // Accents (brightened for dark mode visibility)
    '--color-accent-primary': '#4077e4', // Brighter brand
    '--color-accent-secondary': '#5ca3e0', // Brighter secondary

    // Semantic colors (darker versions)
    '--color-success': '#15803d', // Darker green
    '--color-warning': '#a16207', // Darker yellow
    '--color-error': '#b91c1c', // Darker red
    '--color-info': '#0369a1', // Darker blue

    // Borders
    '--color-border': '#2d3443',
    '--color-border-muted': '#1f242f',

    // Interactive
    '--color-interactive': '#2c5dcd',
    '--color-interactive-hover': '#5485ed',
    '--color-interactive-active': '#6693f5',
    '--color-interactive-disabled': '#4a5568',

    // Gradients (keeping structure)
    '--gradient-brand':
      'linear-gradient(to right, var(--color-brand), var(--color-brand-secondary))',
    '--gradient-surface':
      'linear-gradient(to bottom, var(--color-surface-primary), var(--color-surface-secondary))',
  },
}


export type ThemeType = 'light' | 'dark'


