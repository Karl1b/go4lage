import { useEffect, useState } from 'react'
import { OrganizationT } from '../util/types'
import Button from '../stylecomponents/Button'

export default function OrganizationSearchBar({
  setShowData,
  allOrganizations,
}: {
  setShowData: React.Dispatch<React.SetStateAction<OrganizationT[]>>
  allOrganizations: OrganizationT[]
}) {
  const [organizationName, setOrganizationName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [expirySort, setExpirySort] = useState<'asc' | 'desc' | ''>('')

  function handleSearch() {
    try {
      let filteredOrganizations = allOrganizations

      // Filter by organization name
      if (organizationName) {
        filteredOrganizations = filteredOrganizations.filter((org) =>
          org.organization_name.toLowerCase().includes(organizationName.toLowerCase())
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

  // Get organizations expiring soon (within 30 days)
  const getExpiringSoonCount = () => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const currentDate = new Date()
    
    return allOrganizations.filter(org => {
      const expiryDate = new Date(org.active_until)
      return expiryDate > currentDate && expiryDate <= thirtyDaysFromNow
    }).length
  }

  const expiringSoonCount = getExpiringSoonCount()

  return (
    <div className="p-4 space-y-4">
      {/* Alert for expiring organizations */}
      {expiringSoonCount > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
          <span className="text-orange-600 text-sm font-medium">
            ⚠️ {expiringSoonCount} organization{expiringSoonCount > 1 ? 's' : ''} expiring within 30 days
          </span>
        </div>
      )}

      {/* Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Organization Name"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="px-4 py-2 rounded-lg bg-surface-primary text-text-primary border-2 border-border-default placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="px-4 py-2 rounded-lg bg-surface-primary text-text-primary border-2 border-border-default placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'expired')}
          className="px-4 py-2 rounded-lg bg-surface-primary text-text-primary border-2 border-border-default focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>

        <div className="flex gap-2">
          <Button 
            kind="primary" 
            onClick={handleSearch}
            className="flex-1 bg-interactive-default hover:bg-interactive-hover active:bg-interactive-active text-text-inverse"
          >
            Search
          </Button>
          <Button 
            kind="secondary" 
            onClick={handleShowAll}
            className="flex-1 bg-surface-secondary hover:bg-surface-tertiary text-text-primary border-border-default"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-text-primary">Sort by Expiry:</label>
          <div className="flex gap-1">
            <button
              onClick={() => setExpirySort(expirySort === 'asc' ? '' : 'asc')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                expirySort === 'asc'
                  ? 'bg-interactive-default text-white'
                  : 'bg-surface-secondary hover:bg-surface-tertiary text-text-primary'
              }`}
              title="Expiring Soon First"
            >
              ↑ Soon
            </button>
            <button
              onClick={() => setExpirySort(expirySort === 'desc' ? '' : 'desc')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                expirySort === 'desc'
                  ? 'bg-interactive-default text-white'
                  : 'bg-surface-secondary hover:bg-surface-tertiary text-text-primary'
              }`}
              title="Expiring Later First"
            >
              ↓ Later
            </button>
          </div>
        </div>

        <div className="ml-auto text-sm text-text-secondary">
          Showing {allOrganizations.length} organization{allOrganizations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}