import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MainContext } from '../App'
import api from '../util/api'
import { Permission } from '../util/types'
import Button from '../stylecomponents/Button'

export default function ManagePermission() {
  const navigate = useNavigate()
  const { userData, setToast } = useContext(MainContext)
  const { id } = useParams()
  const permissionId = id ?? ''

  const [permission, setPermission] = useState<Permission | null>(null)

  useEffect(() => {
    async function getPermissions() {
      const res = await api.getPermissionById(userData.token, permissionId)
      setPermission(res || null)
    }
    getPermissions()
  }, [userData, permissionId])

  function deletePermission() {
    api.deletePermission(userData.token, permissionId, setToast).then(() => {
      navigate('/groupspermissions')
    })
  }

  return (
    <div className="flex justify-center">
      <div className="bg-transparent p-8 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {permission?.name || 'Loading...'}
        </h1>

        <div className="flex justify-center space-x-4">
          <Button kind="danger" onClick={deletePermission}>
            Delete Permission
          </Button>
        </div>
      </div>
    </div>
  )
}
