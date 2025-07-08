import { useContext, useEffect, useState } from 'react'
import api from '../util/api'
import { User, Group } from '../util/types'
import SearchBar from '../components/SearchBar'
import UserCardContainer from '../components/UserCardContainer'
import { MainContext } from '../App'

export default function ShowUsers() {
  const { userData } = useContext(MainContext)
  const [allUserData, setAllUserData] = useState<User[]>([])
  const [showData, setShowData] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])

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
    fetchUsers()
    getGroups()
  }, [userData])

  return (
    <div className="space-y-6">
      <div className="bg-surface-primary rounded-lg border border-border-default p-6">
        <h1 className="text-2xl font-semibold text-text-primary mb-6">Users</h1>
        
        <div className="mb-6">
          <SearchBar
            setShowData={setShowData}
            availableGroups={availableGroups}
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