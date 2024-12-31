import { useEffect, useState } from 'react'
import { Group, User } from '../util/types'
import Button from '../stylecomponents/Button'

export default function SearchBar({
  setShowData,
  availableGroups,
  allUsers,
}: {
  setShowData: React.Dispatch<React.SetStateAction<User[]>>
  availableGroups: Group[]
  allUsers: User[]
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

  function handleSearch() {
    try {
      let filteredUsers = allUsers

      if (username) {
        filteredUsers = filteredUsers.filter((user) =>
          user.username.includes(username)
        )
      }
      if (first_name) {
        filteredUsers = filteredUsers.filter((user) =>
          user.first_name.includes(first_name)
        )
      }
      if (last_name) {
        filteredUsers = filteredUsers.filter((user) =>
          user.last_name.includes(last_name)
        )
      }
      if (email) {
        filteredUsers = filteredUsers.filter((user) =>
          user.email.includes(email)
        )
      }
      filteredUsers = filteredUsers.filter((user) => user.is_active === isActive)
      filteredUsers = filteredUsers.filter((user) => user.is_superuser === isSuperuser)

      if (selectedGroup) {
        filteredUsers = filteredUsers.filter((user) =>
          user.groups.split('|').includes(selectedGroup)
        )
      }

      if (created_at) {
        filteredUsers = filteredUsers.sort((a, b) =>
          created_at === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
      if (last_login) {
        filteredUsers = filteredUsers.sort((a, b) =>
          last_login === 'asc'
            ? new Date(a.last_login).getTime() - new Date(b.last_login).getTime()
            : new Date(b.last_login).getTime() - new Date(a.last_login).getTime()
        )
      }

      setShowData(filteredUsers)
    } catch (e) {
      console.log(e)
    }
  }

  function handleShowAll() {
    setShowData(allUsers)
  }

  useEffect(() => {
    handleSearch()
  }, [created_at, last_login, selectedGroup, isActive, isSuperuser])

  return (
    <div className="p-4">
      <div className="grid">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 m-2 rounded h-12 bg-surface-primary text-text-primary border-2 border-border-default placeholder-text-muted"
          />
          <input
            type="text"
            placeholder="First Name"
            value={first_name}
            onChange={(e) => setFirst_name(e.target.value)}
            className="p-2 m-2 rounded h-12 bg-surface-primary border-2 text-text-primary border-border-default placeholder-text-muted"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={last_name}
            onChange={(e) => setLast_name(e.target.value)}
            className="p-2 m-2 rounded h-12 bg-surface-primary border-2 text-text-primary border-border-default placeholder-text-muted"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 m-2 rounded h-12 bg-surface-primary border-2 text-text-primary border-border-default placeholder-text-muted"
          />
  
          <div className="grid grid-flow-cols-2 grid-flow-col gap-2">
            <Button 
              kind="primary" 
              onClick={handleSearch} 
              className="bg-interactive-default hover:bg-interactive-hover active:bg-interactive-active text-text-inverse"
            >
              Search
            </Button>
            <Button 
              kind="secondary" 
              onClick={handleShowAll} 
              className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary border-border-default"
            >
              Show All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6">
          <div className="flex flex-col items-start p-2 m-2 rounded h-12">
            <label className="flex items-center text-nowrap text-text-primary">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mr-2 accent-interactive-default"
              />
              Is Active
            </label>
            <label className="flex items-center text-nowrap text-text-primary">
              <input
                type="checkbox"
                checked={isSuperuser}
                onChange={(e) => setIsSuperuser(e.target.checked)}
                className="mr-2 accent-interactive-default"
              />
              Is Superuser
            </label>
          </div>
  
          <div className="p-2 rounded h-12 flex flex-col justify-center">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="p-2 rounded w-full bg-surface-primary text-text-primary border-border-default"
            >
              <option value="">All Groups</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center p-2 rounded h-12">
            <label className="mr-2 text-text-primary">Created At</label>
            <button
              onClick={() => {
                setCreated_at(created_at === 'asc' ? 'desc' : 'asc')
                handleSearch()
              }}
              className="p-2 rounded border-border-default bg-surface-secondary hover:bg-surface-tertiary text-text-primary"
            >
              {created_at === 'asc' ? '↓' : '↑'}
            </button>
          </div>
          <div className="flex items-center p-2 rounded h-12">
            <label className="mr-2 text-text-primary">Last Login</label>
            <button
              onClick={() => {
                setLast_login(last_login === 'asc' ? 'desc' : 'asc')
                handleSearch()
              }}
              className="p-2 rounded border-border-default bg-surface-secondary hover:bg-surface-tertiary text-text-primary"
            >
              {last_login === 'asc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
