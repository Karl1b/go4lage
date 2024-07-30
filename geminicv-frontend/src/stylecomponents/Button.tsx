import React from 'react'

type ButtonProps = {
  kind?: 'primary' | 'secondary' | 'danger'
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'submit' | 'button' | 'reset' | undefined
}

export default function Button({
  kind,
  children,
  onClick,
  className = '',
  type = undefined,
}: ButtonProps) {
  const baseClasses =
    'm-2 p-2 rounded transition ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50'

  let classes = `${baseClasses} ${className}`

  switch (kind) {
    case 'primary':
      classes +=
        ' bg-pink text-white hover:bg-slate-800 focus:ring-slate-800'
      break
    case 'secondary':
      classes += ' bg-gray-700 text-white hover:bg-slate-800 focus:ring-gray-600'
      break
    case 'danger':
      classes += ' bg-red-500 text-black hover:bg-slate-800 hover:text-red-500 hover:font-bold focus:ring-red-800'
      break
    default:
      break
  }

  return (
    <button onClick={onClick} className={classes} type={type}>
      {children}
    </button>
  )
}
