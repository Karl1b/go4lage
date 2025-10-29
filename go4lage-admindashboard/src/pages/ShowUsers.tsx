import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../util/api'
import { User, Group, OrganizationT } from '../util/types'
import SearchBar from '../components/SearchBar'
import UserCardContainer from '../components/UserCardContainer'
import { MainContext } from '../App'
import { t } from 'i18next'

export default function ShowUsers() {
  const { userData } = useContext(MainContext)
  const navigate = useNavigate()
  const [allUserData, setAllUserData] = useState<User[]>([])
  const [showData, setShowData] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [availableOrganizations, setAvailableOrganizations] = useState<OrganizationT[]>([])

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
      {/* Header Section - Outside the card for better hierarchy */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Users</h1>
        <button
          onClick={() => navigate('/createuser')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          {t('createNewUser')}
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6">
        <div className="mb-6">
          <SearchBar
            setShowData={setShowData}
            availableGroups={availableGroups}
            availableOrganizations={availableOrganizations}
            allUsers={allUserData}
          />
        </div>

        {showData.length > 0 ? (
          <UserCardContainer showData={showData} />
        ) : (
          <div className="text-center py-12 text-text-secondary">
            No users found
          </div>
        )}
      </div>
    </div>
  )
}