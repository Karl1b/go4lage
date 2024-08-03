import { useContext, useEffect, useState } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import { Group, Permission, UserDetails } from '../util/types'

import GPcard from '../components/GPcard'
import Button from '../stylecomponents/Button'

export default function GroupsPermissions() {
  const { userData, setToast } = useContext(MainContext)

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  const [newGroupName, setNewGroupName] = useState<string>('')
  const [newPermissionName, setNewPermissionName] = useState<string>('')

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
    <>
      <h1 className="p-2 text-center">Groups</h1>

      <div className="flex justify-center mb-5">
        {groups?.map((group: Group) => {
          return <GPcard key={group.id} item={group} isGroup={true} />
        })}
      </div>

      <h1 className=" m-6 text-center">Permissions</h1>

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
            <h1 className=" m-6 text-center">Create new group</h1>
          </div>

          <div className="flex justify-center">
            <div className="">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="block w-full rounded-md border border-gray-300 p-2 m-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="New group name"
              />
            </div>

            <div className="">
              <Button
                kind="primary"
                onClick={handleNewGroup}
                className="w-full p-2 m-2 bg-brand text-gray-900 font-semibold rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
        <div>
          <div className="m-2">
            <div className="flex justify-center">
              <h1 className="m-6 text-center">Create new permission</h1>
            </div>

            <div className="flex justify-center">
              <div className="">
                <input
                  type="text"
                  value={newPermissionName}
                  onChange={(e) => setNewPermissionName(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 p-2 m-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="New permission name"
                />
              </div>

              <div className="">
                <Button
                  kind="primary"
                  onClick={handleNewPermission}
                  className="w-full p-2 m-2 bg-brand text-gray-900 font-semibold rounded-md hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-opacity-50 transition"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
