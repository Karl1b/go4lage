import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MainContext } from '../App'
import api from '../util/api'
import { Group, Permission } from '../util/types'
import Checkbox from '../components/Checkbox'
import Button from '../stylecomponents/Button'

export default function ManageGroup() {
  const navigate = useNavigate()
  const { userData, setToast } = useContext(MainContext)
  const { id } = useParams()
  const groupId = id ?? ''
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [group, setGroup] = useState<Group | null>(null)

  useEffect(() => {
    async function getGroup() {
      const res = await api.getGroupById(userData.token, groupId)
      setGroup(res || null)
    }
    getGroup()

    async function getPermissions() {
      const res = await api.getPermissionForGroup(userData.token, groupId)
      setPermissions(res || [])
    }
    getPermissions()
  }, [userData, groupId])

  function deleteGroup() {
    api.deleteGroup(userData.token, groupId, setToast).then(() => {
      navigate('/groupspermissions')
    })
  }

  function handleSubmit() {
    api.editGroupPermissions(userData.token, groupId, permissions, setToast)
  }

  return (
    <div className="flex justify-center">
      <div className="bg-transparent p-8 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {group?.name || 'Loading...'}
        </h1>
        <div className="relative mb-4">
          <h2 className="text-xl font-bold mb-4 text-center">Permissions</h2>
          <div className="flex flex-wrap">
            {permissions.map((permission, index) => (
              <div key={permission.id}>
                <Checkbox
                  label={permission.name}
                  checked={permission.checked}
                  onChange={(checked) => {
                    const updatedPermissions = [...permissions]
                    updatedPermissions[index].checked = checked
                    setPermissions(updatedPermissions)
                  }}
                />{' '}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <Button onClick={handleSubmit} kind="primary">
            Submit
          </Button>
          <Button kind="danger" onClick={deleteGroup}>
            Delete Group
          </Button>
        </div>
      </div>
    </div>
  )
}
