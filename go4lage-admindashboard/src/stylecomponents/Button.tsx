import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export default function Button({ 
  kind = 'primary', 
  size = 'md',
  children, 
  className = '',
  disabled = false,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizeStyles = {
    sm: 'px-2 py-1.5 text-sm font-normal',
    md: 'px-3 py-2.5 text-base font-medium',
    lg: 'px-4 py-3 text-lg font-semibold'
  }
  
  const kindStyles = {
    primary: 'bg-brand hover:bg-brand-secondary text-text-primary focus:ring-brand',
    secondary: 'bg-surface-secondary hover:bg-surface-tertiary text-text-primary border border-border-default focus:ring-brand',
    danger: 'bg-error hover:bg-error/90 text-text-primary focus:ring-error',
    ghost: 'bg-transparent hover:bg-surface-secondary text-text-primary focus:ring-brand'
  }
  
  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${kindStyles[kind]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}