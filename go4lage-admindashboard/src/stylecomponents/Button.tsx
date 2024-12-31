type ButtonProps = {
  kind?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'submit' | 'button' | 'reset' | undefined
  disabled?: boolean
}

export default function Button({
  kind,
  children,
  onClick,
  className = '',
  type = undefined,
  disabled = false,
}: ButtonProps) {
  const baseClasses = `
    m-2 p-2 rounded 
    transition-all duration-200 ease-in-out 
    focus:outline-none focus:ring-2 focus:ring-opacity-50
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `

  const variants = {
    primary: `
      bg-interactive-default text-text-primary
      hover:bg-interactive-hover 
      active:bg-interactive-active
      focus:ring-interactive
      disabled:bg-interactive-disabled
    `,
    secondary: `
      bg-surface-secondary text-text-primary
      hover:bg-surface-tertiary
      active:bg-surface-inverse active:text-text-inverse
      focus:ring-interactive
      disabled:bg-surface-tertiary disabled:text-text-muted
    `,
    danger: `
      bg-error text-text-inverse
      hover:bg-surface-inverse hover:text-error
      active:bg-error active:text-text-inverse
      focus:ring-error
      disabled:bg-error disabled:opacity-50
    `,
  }

  const variantClasses = kind ? variants[kind] : ''
  const classes = `${baseClasses} ${variantClasses}`

  return (
    <button
      onClick={onClick}
      className={classes}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  )
}