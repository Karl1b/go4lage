import { useEffect, useState } from 'react'
import { db } from '../db/db'
import { Group, User } from '../util/types'
import Button from '../stylecomponents/Button'

export default function SearchBar({
  setShowData,
  availableGroups,
}: {
  setShowData: React.Dispatch<React.SetStateAction<User[]>>
  availableGroups: Group[]
}) {
  const [username, setUsername] = useState<string>('')
  const [first_name, setFirst_name] = useState<string>('')
  const [last_name, setLast_name] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isActive, setIsActive] = useState<boolean>(true)
  const [isSuperuser, setIsSuperuser] = useState<boolean>(false)
  const [created_at, setCreated_at] = useState<'asc' | 'desc' | ''>('')
  const [last_login, setLast_login] = useState<'asc' | 'desc' | ''>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')

  async function handleSearch() {
    try {
      let collection = db.users.toCollection()

      if (username) {
        collection = collection.filter((user) =>
          user.username.includes(username)
        )
      }
      if (first_name) {
        collection = collection.filter((user) =>
          user.first_name.includes(first_name)
        )
      }
      if (last_name) {
        collection = collection.filter((user) =>
          user.last_name.includes(last_name)
        )
      }
      if (email) {
        collection = collection.filter((user) => user.email.includes(email))
      }
      collection = collection.filter((user) => user.is_active === isActive)
      collection = collection.filter(
        (user) => user.is_superuser === isSuperuser
      )
      if (selectedGroup) {
        collection = collection.filter((user) =>
          user.groups.split('|').includes(selectedGroup)
        )
      }

      let result = await collection.toArray()

      if (created_at) {
        result = result.sort((a, b) =>
          created_at === 'asc'
            ? new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
        )
      }
      if (last_login) {
        result = result.sort((a, b) =>
          last_login === 'asc'
            ? new Date(a.last_login).getTime() -
              new Date(b.last_login).getTime()
            : new Date(b.last_login).getTime() -
              new Date(a.last_login).getTime()
        )
      }

      setShowData(result)
    } catch (e) {
      console.log(e)
    }
  }

  async function handleShowAll() {
    try {
      const result = await db.users.toArray()
      setShowData(result)
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    handleSearch()
  }, [created_at, last_login, selectedGroup, isActive, isSuperuser])

  //<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-4">
  return (
    <div className="p-4">
      <div className="grid">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 m-2 rounded h-12"
          />
          <input
            type="text"
            placeholder="First Name"
            value={first_name}
            onChange={(e) => setFirst_name(e.target.value)}
            className="p-2 m-2 rounded h-12"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={last_name}
            onChange={(e) => setLast_name(e.target.value)}
            className="p-2 m-2 rounded h-12"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 m-2 rounded h-12"
          />

          <div className="grid grid-flow-cols-2 grid-flow-col">
            <Button kind="primary" onClick={handleSearch} className="">
              Search
            </Button>
            <Button kind="secondary" onClick={handleShowAll} className="">
              Show All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6">

        <div className="flex flex-col items-start p-2 m-2 rounded h-12">
          <label className="flex items-center text-nowrap">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => {
                setIsActive(e.target.checked)
              }}
              className="mr-2"
            />
            Is Active
          </label>
          <label className="flex items-center text-nowrap">
            <input
              type="checkbox"
              checked={isSuperuser}
              onChange={(e) => {
                setIsSuperuser(e.target.checked)
              }}
              className="mr-2"
            />
            Is Superuser
          </label>
        </div>

        <div className="p-2  rounded h-12 flex flex-col justify-center">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="p-2  rounded w-full"
          >
            <option value="">All Groups</option>
            {availableGroups.map((group) => (
              <option key={group.id} value={group.name}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center p-2  rounded h-12">
          <label className="mr-2">Created At</label>
          <button
            onClick={() => {setCreated_at(created_at === 'asc' ? 'desc' : 'asc');handleSearch()}}
            className="p-2  rounded border"
          >
            {created_at === 'asc' ? '↓' : '↑'}
          </button>
        </div>
        <div className="flex items-center p-2  rounded h-12">
          <label className="mr-2">Last Login</label>
          <button
            onClick={() => {setLast_login(last_login === 'asc' ? 'desc' : 'asc');handleSearch()}}
            className="p-2  rounded border"
          >
            {last_login === 'asc' ? '↓' : '↑'}
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}
