import { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MainContext } from '../App'
import api from '../util/api'
import { Group, Permission } from '../util/types'
import Checkbox from '../components/Checkbox'
import Button from '../stylecomponents/Button'
import { FaInfoCircle, FaArrowLeft } from 'react-icons/fa'

export default function ManageGroup() {
  const navigate = useNavigate()
  const { userData, setToast } = useContext(MainContext)
  const { id } = useParams()
  const groupId = id ?? ''
  
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [group, setGroup] = useState<Group | null>(null)
  const [showPermInfo, setShowPermInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [groupRes, permissionsRes] = await Promise.all([
          api.getGroupById(userData.token, groupId),
          api.getPermissionForGroup(userData.token, groupId)
        ])
        
        setGroup(groupRes || null)
        setPermissions(permissionsRes || [])
      } catch (error) {
        console.error('Error fetching group data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [userData, groupId])

  function handlePermissionChange(index: number, checked: boolean) {
    const updatedPermissions = [...permissions]
    updatedPermissions[index].checked = checked
    setPermissions(updatedPermissions)
  }

  function handleSubmit() {
    api.editGroupPermissions(userData.token, groupId, permissions, setToast)
  }

  function deleteGroup() {
    api.deleteGroup(userData.token, groupId, setToast).then(() => {
      navigate('/groupspermissions')
    })
  }

  function goBack() {
    navigate('/groupspermissions')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-surface-primary rounded-lg border border-border-default p-8">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-surface-secondary rounded w-48 mx-auto"></div>
              <div className="h-4 bg-surface-secondary rounded w-32 mx-auto"></div>
            </div>
            <p className="text-text-secondary mt-4">Loading group...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="mb-6">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-accent-primary hover:text-accent-secondary transition-colors mb-4"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span>Back to Groups & Permissions</span>
        </button>
        
        <div className="bg-surface-primary rounded-lg border border-border-default p-6">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-text-primary mb-2">
              {group?.name || 'Unknown Group'}
            </h1>
            <p className="text-text-secondary">
              Manage permissions for this group
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Section */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Group Permissions</h2>
          <FaInfoCircle
            className="w-5 h-5 text-accent-primary cursor-pointer hover:text-accent-secondary transition-colors"
            onClick={() => setShowPermInfo(!showPermInfo)}
          />
        </div>

        {showPermInfo && (
          <div className="mb-6 p-4 bg-info/10 rounded-lg">
            <div className="text-text-primary">
              <p className="mb-2">
                Group permissions define what actions members of this group can perform within the system. 
                Users inherit all permissions from the groups they belong to.
              </p>
              <p>
                Select the permissions you want to grant to all members of the "{group?.name}" group. 
                Changes will apply to all current and future group members automatically.
              </p>
            </div>
          </div>
        )}

        {permissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-surface-secondary rounded-lg max-h-64 overflow-y-auto">
            {permissions.map((permission, index) => (
              <Checkbox
                key={permission.id}
                label={permission.name}
                checked={permission.checked}
                onChange={(checked) => handlePermissionChange(index, checked)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            <p className="text-lg mb-2">No permissions available</p>
            <p className="text-sm">There are no permissions configured in the system yet.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-surface-primary rounded-lg border border-border-default p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleSubmit} 
            kind="primary"
            className="flex-1"
            disabled={permissions.length === 0}
          >
            Save Changes
          </Button>
          <Button 
            onClick={deleteGroup} 
            kind="danger"
            className="flex-1 sm:flex-none sm:min-w-[140px]"
          >
            Delete Group
          </Button>
        </div>
        
        {permissions.length === 0 && (
          <p className="text-text-muted text-sm text-center mt-3">
            Create some permissions first to assign them to this group
          </p>
        )}
      </div>
    </div>
  )
}