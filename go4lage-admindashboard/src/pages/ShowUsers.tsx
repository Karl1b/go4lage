import { useContext, useEffect, useState } from 'react'

import { db } from '../db/db'

import api from '../util/api'
import { User, Group } from '../util/types'
import SearchBar from '../components/SearchBar'
import UserCardContainer from '../components/UserCardContainer'
import { MainContext } from '../App'

export default function ShowUsers() {
  const { userData } = useContext(MainContext)
  const [showData, setShowData] = useState<User[]>([])
  const [availableGroups, setAvailableGroups] = useState<Group[]>([])

  useEffect(() => {
    let isMounted: boolean = true
    async function showAll() {
      try {
        const collection = db.users
        const result = await collection.toArray()
        if (isMounted) {
          setShowData(result)
        }
      } catch (e) {
        console.log(e)
      }
    }

    async function fetchUsers() {
      if (!userData || !userData.token) {
        return
      }
      try {
        const response = await api.allusers(userData.token)
        console.log('Fetched users:', response)
        await db.open()
        await db.users.clear()
        await db.users.bulkAdd(response)
        const usersFromDb = await db.users.toArray()
        if (isMounted) {
          setShowData(usersFromDb)
        }
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
        if (isMounted) {
          setAvailableGroups(res || [])
        }
      } catch (e) {
        console.error('Error fetching groups:', e)
      }
    }

    fetchUsers().then(showAll)
    getGroups()

    return () => {
      async function clearDB() {
        try {
          await db.open()
          await db.users.clear()
        } catch (e) {
          console.log(e)
        }
      }
      clearDB()
      isMounted = false
    }
  }, [userData])

  return (
    <div className="flex flex-col justify-center items-center">
      <SearchBar setShowData={setShowData} availableGroups={availableGroups} />
      <UserCardContainer showData={showData} />
    </div>
  )
}
