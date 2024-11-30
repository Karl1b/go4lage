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
    <div className="flex justify-center">
      <div className="bg-transparent p-2 rounded-lg w-full max-w-md md:max-w-lg lg:max-w-2xl">
        <h1 className=" mb-6 text-center">{headText}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Email
            </label>
            <div className="relative mb-4">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Email"
              />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Password
            </label>
            <MaskedInput password={password} setPassword={setPassword} />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Username
            </label>
            <div className="relative mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Username"
              />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              First name
            </label>
            <div className="relative mb-4">
              <input
                type="text"
                value={first_name}
                onChange={(e) => setFirst_name(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="First name"
              />
            </div>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Last name
            </label>
            <div className="relative mb-4">
              <input
                type="text"
                value={last_name}
                onChange={(e) => setLast_name(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-4">
          <div className="flex mr-4 items-center">
            <Checkbox
              label={'Is Active'}
              checked={isActive}
              onChange={() => setIsActive(!isActive)}
            />
          </div>
          <div className="flex ml-4 items-center">
            <Checkbox
              label={'Is superuser'}
              checked={isSuperuser}
              onChange={() => setIsSuperuser(!isSuperuser)}
            />
          </div>
        </div>
        <div className="relative mb-4">
          <div className="flex justify-center items-center">
            <h2 className="mb-4 text-center">Groups</h2>{' '}
            <FaInfoCircle
              className="w-7 h-7 text-secondheader cursor-pointer"
              onClick={() => {
                setShowGroupInfo(!showGroupInfo)
              }}
            />
          </div>

          {showGroupInfo && (
          <GroupText />
          )}

          <div className="flex flex-wrap">
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
        <div className="relative mb-4">
          <div className="flex justify-center items-center">
            <h2 className="mb-4 text-center">Pure permissions</h2>
            <FaInfoCircle
              className="w-7 h-7 text-secondheader cursor-pointer"
              onClick={() => {
                setShowPermInfo(!showPermInfo)
              }}
            />
          </div>
          {showPermInfo && (
            <div>
              <p>
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

          <div className="flex flex-wrap">
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
        <div className="flex justify-center space-x-4">
          <Button onClick={handleSubmit} kind="primary">
            Submit
          </Button>
          {headText != 'Create user' && (
            <Button onClick={deleteUser} kind="danger">
              Delete User
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
