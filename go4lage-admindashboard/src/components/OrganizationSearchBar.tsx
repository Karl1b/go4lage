import { useEffect, useState } from 'react'
import { OrganizationT } from '../util/types'
import Button from '../stylecomponents/Button'
import { useTranslation } from 'react-i18next'

export default function OrganizationSearchBar({
  setShowData,
  allOrganizations,
}: {
  setShowData: React.Dispatch<React.SetStateAction<OrganizationT[]>>
  allOrganizations: OrganizationT[]
}) {
  const { t } = useTranslation()
  const [organizationName, setOrganizationName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'expired'
  >('all')
  const [expirySort, setExpirySort] = useState<'asc' | 'desc' | ''>('')

  function handleSearch() {
    try {
      let filteredOrganizations = allOrganizations

      // Filter by organization name
      if (organizationName) {
        filteredOrganizations = filteredOrganizations.filter((org) =>
          org.organization_name
            .toLowerCase()
            .includes(organizationName.toLowerCase())
        )
      }

      // Filter by email
      if (email) {
        filteredOrganizations = filteredOrganizations.filter((org) =>
          org.email.toLowerCase().includes(email.toLowerCase())
        )
      }

      // Filter by status
      if (statusFilter !== 'all') {
        const currentDate = new Date()
        filteredOrganizations = filteredOrganizations.filter((org) => {
          const isActive = new Date(org.active_until) > currentDate
          return statusFilter === 'active' ? isActive : !isActive
        })
      }

      // Sort by expiry date
      if (expirySort) {
        filteredOrganizations = filteredOrganizations.sort((a, b) => {
          const dateA = new Date(a.active_until).getTime()
          const dateB = new Date(b.active_until).getTime()
          return expirySort === 'asc' ? dateA - dateB : dateB - dateA
        })
      }

      setShowData(filteredOrganizations)
    } catch (e) {
      console.error('Error filtering organizations:', e)
    }
  }

  function handleShowAll() {
    setShowData(allOrganizations)
    // Reset all filters
    setOrganizationName('')
    setEmail('')
    setStatusFilter('all')
    setExpirySort('')
  }

  // Auto-search when filters change
  useEffect(() => {
    handleSearch()
  }, [statusFilter, expirySort])

  // Execute search on mount and when allOrganizations changes
  useEffect(() => {
    if (allOrganizations.length > 0) {
      handleSearch()
    }
  }, [allOrganizations])

  // Get organizations expiring soon (within 30 days)
  const getExpiringSoonCount = () => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const currentDate = new Date()

    return allOrganizations.filter((org) => {
      const expiryDate = new Date(org.active_until)
      return expiryDate > currentDate && expiryDate <= thirtyDaysFromNow
    }).length
  }

  const expiringSoonCount = getExpiringSoonCount()

  return (
    <div className="p-6 space-y-4 bg-surface-secondary border-b border-border-default">
      {/* Alert for expiring organizations */}
      {expiringSoonCount > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800">
              {expiringSoonCount}{' '}
              {expiringSoonCount === 1
                ? t('OrganizationExpiringWithin30Days')
                : t('OrganizationsExpiringWithin30Days', {
                    count: expiringSoonCount,
                  })}
            </p>
          </div>
        </div>
      )}

      {/* Search Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder={t('OrganizationName')}
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="px-4 py-2 rounded-lg bg-surface-primary text-text-primary border-2 border-border-default placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />

        <input
          type="email"
          placeholder={t('Email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="px-4 py-2 rounded-lg bg-surface-primary text-text-primary border-2 border-border-default placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | 'active' | 'expired')
          }
          className="px-4 py-2 rounded-lg bg-surface-primary text-text-primary border-2 border-border-default focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        >
          <option value="all">{t('AllStatus')}</option>
          <option value="active">{t('Active')}</option>
          <option value="expired">{t('Expired')}</option>
        </select>

        <div className="flex gap-2">
          <Button
            kind="primary"
            onClick={handleSearch}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t('Search')}
          </Button>
          <Button
            kind="secondary"
            onClick={handleShowAll}
            className="flex-1 bg-surface-secondary hover:bg-surface-tertiary text-text-primary border-2 border-border-default"
          >
            {t('Clear')}
          </Button>
        </div>
      </div>

      {/* Sort and Stats Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-primary whitespace-nowrap">
            {t('SortByExpiry')}:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setExpirySort(expirySort === 'asc' ? '' : 'asc')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                expirySort === 'asc'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-surface-primary hover:bg-surface-tertiary text-text-primary border border-border-default'
              }`}
              title={t('ExpiringSoonFirst')}
            >
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                {t('Soon')}
              </span>
            </button>
            <button
              onClick={() => setExpirySort(expirySort === 'desc' ? '' : 'desc')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                expirySort === 'desc'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-surface-primary hover:bg-surface-tertiary text-text-primary border border-border-default'
              }`}
              title={t('ExpiringLaterFirst')}
            >
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                {t('Later')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
