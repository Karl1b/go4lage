import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../util/api'
import { OrganizationT } from '../util/types'
import OrganizationSearchBar from '../components/OrganizationSearchBar'
import OrganizationCardContainer from '../components/OrganizationCardContainer'
import { MainContext } from '../App'
import { useTranslation } from 'react-i18next'

export default function ShowOrganizations() {
  const { userData } = useContext(MainContext)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [allOrganizationData, setAllOrganizationData] = useState<
    OrganizationT[]
  >([])
  const [showData, setShowData] = useState<OrganizationT[]>([])

  useEffect(() => {
    async function fetchOrganizations() {
      if (!userData || !userData.token) {
        return
      }
      try {
        const response = await api.allOrganizations(userData.token)
        if (!response) {
          return
        }
        setAllOrganizationData(response)
        setShowData(response)
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error fetching organizations:', err)
        } else {
          console.log(err)
        }
      }
    }
    fetchOrganizations()
  }, [userData])

  return (
    <div className="space-y-6">
      {/* Content Card with Header Inside */}
      <div className="bg-surface-primary rounded-lg border border-border-default shadow-sm">
        {/* Header Section - Inside the card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-border-default">
          <h1 className="text-2xl font-semibold text-text-primary">
            {t('organizations')}
          </h1>
          <button
            onClick={() => navigate('/createorganization')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('createNewOrganization')}
          </button>
        </div>

        {/* Search Bar */}
        <OrganizationSearchBar
          setShowData={setShowData}
          allOrganizations={allOrganizationData}
        />

        {/* Results */}
        <div className="p-6 pt-0">
          {showData.length > 0 ? (
            <OrganizationCardContainer showData={showData} />
          ) : (
            <div className="text-center py-12 text-text-secondary">
              {t('noOrganizationsFound')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}