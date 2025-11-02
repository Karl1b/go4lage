import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../util/api'
import { User, Group, OrganizationT } from '../util/types'
import SearchBar from '../components/SearchBar'
import UserCardContainer from '../components/UserCardContainer'
import { MainContext } from '../App'
import { useTranslation } from 'react-i18next'

export default function ShowUsers() {
  const { userData } = useContext(MainContext)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [allUserData, setAllUserData] = useState<User[]>([])
  const [showData, setShowData] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [availableOrganizations, setAvailableOrganizations] = useState<
    OrganizationT[]
  >([])

  useEffect(() => {
    async function fetchUsers() {
      if (!userData || !userData.token) {
        return
      }
      try {
        const response = await api.allusers(userData.token)
        if (!response) {
          return
        }
        setAllUserData(response)
        setShowData(response)
      } catch (err) {
        if (err instanceof Error) {
          console.error('Error fetching users:', err)
          if (err.name === 'BulkError') {
            console.error('Detailed BulkError:', err)
          }
        } else {
          console.log(err)
        }
      }
    }

    async function getGroups() {
      try {
        const res = await api.getGroups(userData.token)
        setAvailableGroups(res || [])
      } catch (e) {
        console.error('Error fetching groups:', e)
      }
    }

    async function getOrganizations() {
      try {
        const res = await api.allOrganizations(userData.token)
        setAvailableOrganizations(res || [])
      } catch (e) {
        console.error('Error fetching organizations:', e)
      }
    }

    fetchUsers()
    getGroups()
    getOrganizations()
  }, [userData])

  return (
    <div className="space-y-6">
      {/* Content Card with Header Inside */}
      <div className="bg-surface-primary rounded-lg border border-border-default shadow-sm">
        {/* Header Section - Inside the card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-border-default">
          <h1 className="text-2xl font-semibold text-text-primary">
            {t('users')}
          </h1>
          <button
            onClick={() => navigate('/createuser')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('createNewUser')}
          </button>
        </div>

        {/* Search Bar */}
        <SearchBar
          setShowData={setShowData}
          availableGroups={availableGroups}
          availableOrganizations={availableOrganizations}
          allUsers={allUserData}
        />

        {/* Results */}
        <div className="p-6 pt-0">
          {showData.length > 0 ? (
            <UserCardContainer showData={showData} />
          ) : (
            <div className="text-center py-12 text-text-secondary">
              {t('noUsersFound')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
