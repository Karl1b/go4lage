import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Group, User, OrganizationT } from '../util/types'
import Button from '../stylecomponents/Button'

export default function SearchBar({
  setShowData,
  availableGroups,
  availableOrganizations,
  allUsers,
}: {
  setShowData: React.Dispatch<React.SetStateAction<User[]>>
  availableGroups: Group[]
  availableOrganizations: OrganizationT[]
  allUsers: User[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [username, setUsername] = useState<string>(searchParams.get('username') || '')
  const [first_name, setFirst_name] = useState<string>(searchParams.get('first_name') || '')
  const [last_name, setLast_name] = useState<string>(searchParams.get('last_name') || '')
  const [email, setEmail] = useState<string>(searchParams.get('email') || '')
  const [isActive, setIsActive] = useState<boolean>(searchParams.get('is_active') !== 'false')
  const [isSuperuser, setIsSuperuser] = useState<boolean>(searchParams.get('is_superuser') === 'true')
  const [created_at, setCreated_at] = useState<'asc' | 'desc' | ''>(
    (searchParams.get('created_at') as 'asc' | 'desc') || ''
  )
  const [last_login, setLast_login] = useState<'asc' | 'desc' | ''>(
    (searchParams.get('last_login') as 'asc' | 'desc') || ''
  )
  const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('group') || '')
  const [selectedOrganization, setSelectedOrganization] = useState<string>(
    searchParams.get('organization') || ''
  )

  // Update URL params whenever search state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (username) params.set('username', username)
    if (first_name) params.set('first_name', first_name)
    if (last_name) params.set('last_name', last_name)
    if (email) params.set('email', email)
    if (!isActive) params.set('is_active', 'false')
    if (isSuperuser) params.set('is_superuser', 'true')
    if (created_at) params.set('created_at', created_at)
    if (last_login) params.set('last_login', last_login)
    if (selectedGroup) params.set('group', selectedGroup)
    if (selectedOrganization) params.set('organization', selectedOrganization)
    
    setSearchParams(params, { replace: true })
  }, [
    username,
    first_name,
    last_name,
    email,
    isActive,
    isSuperuser,
    created_at,
    last_login,
    selectedGroup,
    selectedOrganization,
    setSearchParams,
  ])

  function handleSearch() {
    try {
      let filteredUsers = allUsers

      if (username) {
        filteredUsers = filteredUsers.filter((user) =>
          user.username.toLowerCase().includes(username.toLowerCase())
        )
      }
      if (first_name) {
        filteredUsers = filteredUsers.filter((user) =>
          user.first_name.toLowerCase().includes(first_name.toLowerCase())
        )
      }
      if (last_name) {
        filteredUsers = filteredUsers.filter((user) =>
          user.last_name.toLowerCase().includes(last_name.toLowerCase())
        )
      }
      if (email) {
        filteredUsers = filteredUsers.filter((user) =>
          user.email.toLowerCase().includes(email.toLowerCase())
        )
      }
      
      filteredUsers = filteredUsers.filter((user) => user.is_active === isActive)
      filteredUsers = filteredUsers.filter((user) => user.is_superuser === isSuperuser)

      if (selectedGroup) {
        filteredUsers = filteredUsers.filter((user) =>
          user.groups.split('|').includes(selectedGroup)
        )
      }

      if (selectedOrganization) {
        if (selectedOrganization === 'none') {
          // Show users without organization
          filteredUsers = filteredUsers.filter((user) => !user.organization)
        } else {
          // Show users with specific organization
          filteredUsers = filteredUsers.filter((user) => 
            user.organization?.id === selectedOrganization
          )
        }
      }

      if (created_at) {
        filteredUsers = [...filteredUsers].sort((a, b) =>
          created_at === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
      
      if (last_login) {
        filteredUsers = [...filteredUsers].sort((a, b) =>
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
    setUsername('')
    setFirst_name('')
    setLast_name('')
    setEmail('')
    setIsActive(true)
    setIsSuperuser(false)
    setSelectedGroup('')
    setSelectedOrganization('')
    setCreated_at('')
    setLast_login('')
    setShowData(allUsers)
  }

  useEffect(() => {
    handleSearch()
  }, [created_at, last_login, selectedGroup, selectedOrganization, isActive, isSuperuser])

  // Execute search on mount and when allUsers changes (including initial load from URL params)
  useEffect(() => {
    if (allUsers.length > 0) {
      handleSearch()
    }
  }, [allUsers])

  return (
    <div className="p-4">
      <div className="grid">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 rounded h-12 bg-surface-primary text-text-primary border-2 border-border-default placeholder-text-muted"
          />
          <input
            type="text"
            placeholder="First Name"
            value={first_name}
            onChange={(e) => setFirst_name(e.target.value)}
            className="p-2 rounded h-12 bg-surface-primary border-2 text-text-primary border-border-default placeholder-text-muted"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={last_name}
            onChange={(e) => setLast_name(e.target.value)}
            className="p-2 rounded h-12 bg-surface-primary border-2 text-text-primary border-border-default placeholder-text-muted"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 rounded h-12 bg-surface-primary border-2 text-text-primary border-border-default placeholder-text-muted"
          />
  
          <div className="flex gap-2 col-span-2">
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
        
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2 mt-4">
          <div className="flex flex-col justify-center p-2">
            <label className="flex items-center text-nowrap text-text-primary mb-1">
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
  
          <div className="flex flex-col justify-center">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="p-2 rounded bg-surface-primary text-text-primary border-2 border-border-default"
            >
              <option value="">All Groups</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-center">
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="p-2 rounded bg-surface-primary text-text-primary border-2 border-border-default"
            >
              <option value="">All Organizations</option>
              <option value="none">No Organization</option>
              {availableOrganizations.map((org) => (
                <option key={org.id} value={org.id || ''}>
                  {org.organization_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="mr-2 text-text-primary text-nowrap">Created</label>
            <button
              onClick={() => {
                setCreated_at(created_at === 'asc' ? 'desc' : 'asc')
              }}
              className="p-2 rounded border-2 border-border-default bg-surface-secondary hover:bg-surface-tertiary text-text-primary"
            >
              {created_at === 'asc' ? '↓' : '↑'}
            </button>
          </div>
          
          <div className="flex items-center">
            <label className="mr-2 text-text-primary text-nowrap">Last Login</label>
            <button
              onClick={() => {
                setLast_login(last_login === 'asc' ? 'desc' : 'asc')
              }}
              className="p-2 rounded border-2 border-border-default bg-surface-secondary hover:bg-surface-tertiary text-text-primary"
            >
              {last_login === 'asc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}