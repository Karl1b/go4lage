import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react'

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="w-full flex items-center justify-between p-0 bg-transparent border-none text-text-primary hover:text-accent-primary transition-colors duration-200 cursor-pointer"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="text-sm font-medium">Theme</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-secondary capitalize">
          {theme}
        </span>
        <div className="w-6 h-6 rounded-full bg-surface-tertiary flex items-center justify-center">
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-accent-primary" strokeWidth={2} />
          ) : (
            <Sun className="w-4 h-4 text-accent-primary" strokeWidth={2} />
          )}
        </div>
      </div>
    </button>
  )
}