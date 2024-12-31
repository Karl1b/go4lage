import { useTheme } from './ThemeProvider'
import { Moon, Sun } from 'lucide-react' // Using lucide icons for a cleaner look

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  
  return (
    <div className='flex justify-center items-center'>
      <p className='text-text-primary mx-2'>Theme:</p>

    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2.5 rounded-full 
      bg-surface-secondary hover:bg-surface-tertiary
      border border-border-muted
      text-text-primary
      shadow-sm
      transition-all duration-300 ease-in-out
      hover:scale-110
      active:scale-95
      focus:outline-none focus:ring-2 focus:ring-interactive-default focus:ring-opacity-50"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-accent-primary" strokeWidth={2} />
      ) : (
        <Sun className="w-5 h-5 text-accent-primary" strokeWidth={2} />
      )}
    </button>
      </div>
  )
}