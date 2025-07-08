import { Group, Permission } from '../util/types'
import Checkbox from '../components/Checkbox'
import api from '../util/api'
import { useContext, useState } from 'react'
import { MainContext } from '../App'
import Button from '../stylecomponents/Button'
import MaskedInput from './MaskedInput'
import { FaInfoCircle } from 'react-icons/fa'
import { GroupText } from './GroupText'

interface UserFormProps {
  headText: string
  userId: string
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  username: string
  setUserName: (userName: string) => void
  first_name: string
  setFirst_name: (firstName: string) => void
  last_name: string
  setLast_name: (lastName: string) => void
  isActive: boolean
  setIsActive: (isActive: boolean) => void
  isSuperuser: boolean
  setIsSuperuser: (isSuperuser: boolean) => void
  groups: Group[]
  setGroups: (groups: Group[]) => void
  permissions: Permission[]
  setPermissions: (permissions: Permission[]) => void
  handleSubmit: () => void
}

export default function UserForm({
  headText,
  userId,
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUserName,
  first_name,
  setFirst_name,
  last_name,
  setLast_name,
  isActive,
  setIsActive,
  isSuperuser,
  setIsSuperuser,
  groups,
  setGroups,
  permissions,
  setPermissions,
  handleSubmit,
}: UserFormProps) {
  const { userData, setToast } = useContext(MainContext)

  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showPermInfo, setShowPermInfo] = useState(false)

  function handleGroupChange(index: number, checked: boolean) {
    const newGroups = [...groups]
    newGroups[index].checked = checked
    setGroups(newGroups)
  }

  function handlePermissionChange(index: number, checked: boolean) {
    const newPermissions = [...permissions]
    newPermissions[index].checked = checked
    setPermissions(newPermissions)
  }

  function deleteUser() {
    api.deleteUser(userData.token, userId, setToast)
  }

  return (
    <div className="bg-surface-primary rounded-lg border border-border-default p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">{headText}</h1>
      
      <div className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Password
            </label>
            <MaskedInput password={password} setPassword={setPassword} />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              First name
            </label>
            <input
              type="text"
              value={first_name}
              onChange={(e) => setFirst_name(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="John"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Last name
            </label>
            <input
              type="text"
              value={last_name}
              onChange={(e) => setLast_name(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Doe"
            />
          </div>
        </div>

        {/* Status Options */}
        <div className="flex gap-6 p-4 bg-surface-secondary rounded-lg">
          <Checkbox
            label="Is Active"
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
          <Checkbox
            label="Is Superuser"
            checked={isSuperuser}
            onChange={() => setIsSuperuser(!isSuperuser)}
          />
        </div>

        {/* Groups Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium text-text-primary">Groups</h2>
            <FaInfoCircle
              className="w-5 h-5 text-accent-primary cursor-pointer hover:text-accent-secondary"
              onClick={() => setShowGroupInfo(!showGroupInfo)}
            />
          </div>

          {showGroupInfo && (
            <div className="flex mb-4 p-4 bg-info/10 rounded-lg max-w-md lg:max-w-lg">
              <GroupText />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-surface-secondary rounded-lg max-h-48 overflow-y-auto">
            {groups.map((group, index) => (
              <Checkbox
                key={group.id}
                label={group.name}
                checked={group.checked}
                onChange={(checked) => handleGroupChange(index, checked)}
              />
            ))}
          </div>
        </div>

        {/* Permissions Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium text-text-primary">Pure permissions</h2>
            <FaInfoCircle
              className="w-5 h-5 text-accent-primary cursor-pointer hover:text-accent-secondary"
              onClick={() => setShowPermInfo(!showPermInfo)}
            />
          </div>
          
          {showPermInfo && (
            <div className="mb-4 p-4 bg-info/10 rounded-lg text-text-primary">
              <p className="mb-2">
                Pure permissions are individual permissions assigned directly to
                users, rather than inherited through group membership. While
                groups are the preferred way to manage permissions, sometimes
                users need specific access rights without being part of the
                corresponding group.
              </p>
              <p>
                For example, if most users in the "Marketing" group need access
                to social media tools, but an IT support person occasionally
                needs to audit these tools, they can be granted a "pure
                permission" for social media access without joining the
                Marketing group. This allows for more flexible and granular
                access control while keeping your group structure clean and
                logical.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-surface-secondary rounded-lg max-h-48 overflow-y-auto">
            {permissions.map((permission, index) => (
              <Checkbox
                key={permission.id}
                label={permission.name}
                checked={permission.checked}
                onChange={(checked) => handlePermissionChange(index, checked)}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button onClick={handleSubmit} kind="primary">
            {headText === 'Create user' ? 'Create User' : 'Save Changes'}
          </Button>
          {headText !== 'Create user' && (
            <Button onClick={deleteUser} kind="danger">
              Delete User
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}