import React from 'react'
import { useNavigate } from 'react-router-dom'
import ButtonGroup from '../components/ButtonGroup'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface SideBarProps {
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const SideBar: React.FC<SideBarProps> = ({
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-surface-inverse/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-surface-primary
          border-r border-border-default z-50
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-72' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          shadow-lg
        `}
      >
        {/* Header Section */}
        <div className="h-16 border-b border-border-muted px-4 flex items-center justify-center">
          {isExpanded && (
            <div
              className={`
              flex items-center gap-3 cursor-pointer min-w-0
              transition-all duration-300
              ${isExpanded ? 'flex-1' : ''}
            `}
              onClick={() => navigate('/')}
            >
              <h1 className="text-lg font-semibold text-text-primary whitespace-nowrap">
                {t('AdminDashboard')}
              </h1>
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              hidden lg:flex items-center justify-center
              w-8 h-8 rounded-lg flex-shrink-0
              bg-surface-secondary hover:bg-surface-tertiary
              text-text-secondary hover:text-text-primary
              transition-all duration-200
              ${isExpanded ? 'ml-0' : 'ml-0'}
            `}
            aria-label={isExpanded ? t('CollapseSidebar') : t('ExpandSidebar')}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-text-primary transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Section */}

        {isExpanded && (
          <>
            <nav className="flex-1 overflow-y-auto p-4">
              <ButtonGroup />
            </nav>
          </>
        )}
      </aside>
    </>
  )
}

export default SideBar
