import { useContext, useEffect, useState } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import { Group, Permission, UserDetails } from '../util/types'
import GPcard from '../components/GPcard'
import Button from '../stylecomponents/Button'
import { GroupText } from '../components/GroupText'
import { FaInfoCircle } from 'react-icons/fa'

export default function GroupsPermissions() {
  const { userData, setToast } = useContext(MainContext)

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  const [newGroupName, setNewGroupName] = useState<string>('')
  const [newPermissionName, setNewPermissionName] = useState<string>('')

  const [showGroupInfo, setShowGroupInfo] = useState(false)

  async function getGroups(userData: UserDetails) {
    const res = await api.getGroups(userData.token)
    setGroups(res || [])
  }

  async function getPermissions(userData: UserDetails) {
    const res = await api.getPermissions(userData.token)
    setPermissions(res || [])
  }

  function handleNewGroup() {
    api.createGroup(userData.token, newGroupName, setToast).then(() => {
      getGroups(userData)
      setNewGroupName('')
    })
  }

  function handleNewPermission() {
    api
      .createPermission(userData.token, newPermissionName, setToast)
      .then(() => {
        getPermissions(userData)
        setNewPermissionName('')
      })
  }

  useEffect(() => {
    getGroups(userData)
    getPermissions(userData)
  }, [userData])

  return (
    <div className="space-y-8">
      {/* Groups Section */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Groups</h2>
          <FaInfoCircle
            className="w-5 h-5 text-accent-primary cursor-pointer hover:text-accent-secondary"
            onClick={() => setShowGroupInfo(!showGroupInfo)}
          />
        </div>

        {showGroupInfo && (
          <div className="mb-6 p-4 bg-info/10 rounded-lg">
            <GroupText />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups?.map((group: Group) => (
            <GPcard key={group.id} item={group} isGroup={true} />
          ))}
        </div>
      </div>

      {/* Permissions Section */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Permissions</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {permissions?.map((permission: Permission) => (
            <GPcard key={permission.id} item={permission} isGroup={false} />
          ))}
        </div>
      </div>

      {/* Create New Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Group */}
        <div className="bg-surface-primary rounded-lg border border-border-default p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Create new group</h3>
          
          <div className="space-y-4">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="New group name"
            />
            
            <Button
              kind="primary"
              onClick={handleNewGroup}
              className="w-full"
            >
              Create Group
            </Button>
          </div>
        </div>

        {/* Create Permission */}
        <div className="bg-surface-primary rounded-lg border border-border-default p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Create new permission</h3>
          
          <div className="space-y-4">
            <input
              type="text"
              value={newPermissionName}
              onChange={(e) => setNewPermissionName(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="New permission name"
            />
            
            <Button
              kind="primary"
              onClick={handleNewPermission}
              className="w-full"
            >
              Create Permission
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}