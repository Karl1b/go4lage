import React, { useState, useContext, useRef, useEffect } from 'react'
import { Menu, Bell, User, ChevronDown } from 'lucide-react'
import { MainContext } from '../App'
import { ThemeToggle } from '../themecomps/ThemeToggle'
import Logout from '../components/Logout'
import Logo from '../components/Logo'

interface HeaderProps {
  isSidebarExpanded: boolean
  setIsMobileOpen: (open: boolean) => void
}

const Header: React.FC<HeaderProps> = ({
  isSidebarExpanded,
  setIsMobileOpen,
}) => {
  const { userData } = useContext(MainContext)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className={`
        fixed top-0 right-0 h-16 z-30
        bg-surface-primary border-b border-border-default
        transition-all duration-300 ease-in-out
        ${isSidebarExpanded ? 'md:left-0' : 'md:left-0'}
        left-0
      `}
    >
      <div className="flex items-center h-full px-4 md:px-6">
        {/* Left Section - Mobile Menu + Logo */}
        <div className="flex items-center gap-3 flex-1 md:flex-none">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo - Hidden on mobile when sidebar is present */}
          <div className="md:hidden flex-1 flex justify-center">
            <Logo />
          </div>
        </div>

        {/* Center Section - Logo on desktop */}
        <div className="hidden md:flex flex-1 justify-center items-center">
          <Logo />
          <h2 className="text-text-primary ml-2 text-lg">Admin-Dashboard</h2>
        </div>

        {/* Right Section - User Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Button */}
          <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200">
            <Bell className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-text-inverse" />
              </div>
              <span className="hidden sm:block text-sm font-medium truncate max-w-32">
                {userData.email || 'User'}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform shrink-0 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-primary border border-border-default shadow-xl shadow-black/10">
                <div className="px-4 py-3 border-b border-border-muted">
                  <p className="text-sm font-medium text-text-primary">
                    Signed in as
                  </p>
                  <p className="text-sm text-text-secondary truncate">
                    {userData.email}
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer">
                    <ThemeToggle />
                  </div>
                  <div className="px-3 py-2 hover:bg-surface-secondary rounded-lg transition-colors">
                    <Logout />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
