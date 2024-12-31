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
    })
  }

  function handleNewPermission() {
    api
      .createPermission(userData.token, newPermissionName, setToast)
      .then(() => {
        getPermissions(userData)
      })
  }

  useEffect(() => {
    getGroups(userData)
    getPermissions(userData)
  }, [userData])

  return (
    <div className="mt-6">
      <div className="flex justify-center items-center m-2">
        <h2 className="m-4 text-center text-text-primary">Groups</h2>{' '}
        <FaInfoCircle
          className="w-7 h-7 text-accent-primary cursor-pointer"
          onClick={() => {
            setShowGroupInfo(!showGroupInfo)
          }}
        />
      </div>
  
      {showGroupInfo && <GroupText />}
  
      <div className="flex justify-center mb-5">
        {groups?.map((group: Group) => {
          return <GPcard key={group.id} item={group} isGroup={true} />
        })}
      </div>
  
      <h2 className="m-6 text-center text-text-primary">Permissions</h2>
  
      <div className="flex justify-center">
        {permissions?.map((permission: Permission) => {
          return (
            <GPcard key={permission.id} item={permission} isGroup={false} />
          )
        })}
      </div>
  
      <div className="flex justify-center">
        <div className="m-2">
          <div className="flex justify-center">
            <h2 className="m-6 text-center text-text-primary">Create new group</h2>
          </div>
  
          <div className="flex justify-center">
            <div className="">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="block w-full rounded-md border border-border-default p-2 m-2 text-text-primary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-interactive-default focus:border-transparent"
                placeholder="New group name"
              />
            </div>
  
            <div className="">
              <Button
                kind="primary"
                onClick={handleNewGroup}
                className="w-full p-2 m-2 bg-interactive-default text-text-inverse font-semibold rounded-md hover:bg-interactive-hover focus:outline-none focus:ring-2 focus:ring-interactive-default focus:ring-opacity-50 transition"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
        <div>
          <div className="m-2">
            <div className="flex justify-center">
              <h2 className="m-6 text-center text-text-primary">Create new permission</h2>
            </div>
  
            <div className="flex justify-center">
              <div className="">
                <input
                  type="text"
                  value={newPermissionName}
                  onChange={(e) => setNewPermissionName(e.target.value)}
                  className="block w-full rounded-md border border-border-default p-2 m-2 text-text-primary bg-surface-primary focus:outline-none focus:ring-2 focus:ring-interactive-default focus:border-transparent"
                  placeholder="New permission name"
                />
              </div>
  
              <div className="">
                <Button
                  kind="primary"
                  onClick={handleNewPermission}
                  className="w-full p-2 m-2 bg-interactive-default text-text-inverse font-semibold rounded-md hover:bg-interactive-hover focus:outline-none focus:ring-2 focus:ring-interactive-default focus:ring-opacity-50 transition"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
