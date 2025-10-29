import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../util/api'
import { OrganizationT } from '../util/types'
import OrganizationSearchBar from '../components/OrganizationSearchBar'
import OrganizationCardContainer from '../components/OrganizationCardContainer'
import { MainContext } from '../App'
import { t } from 'i18next'

export default function ShowOrganizations() {
  const { userData } = useContext(MainContext)
  const navigate = useNavigate()
  const [allOrganizationData, setAllOrganizationData] = useState<OrganizationT[]>([])
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
      {/* Header Section - Outside the card for better hierarchy */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Organizations</h1>
        <button
          onClick={() => navigate('/createorganization')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          {t('createNewOrganization')}
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6">
        <div className="mb-6">
          <OrganizationSearchBar
            setShowData={setShowData}
            allOrganizations={allOrganizationData}
          />
        </div>

        {showData.length > 0 ? (
          <OrganizationCardContainer showData={showData} />
        ) : (
          <div className="text-center py-12 text-text-secondary">
            No organizations found
          </div>
        )}
      </div>
    </div>
  )
}