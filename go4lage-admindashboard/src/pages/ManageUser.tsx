import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MainContext } from '../App'
import api from '../util/api'
import { Group, NewUser, Permission } from '../util/types'
import UserForm from '../components/UserForm'

export default function ManageUser() {
  const { userData, setToast } = useContext(MainContext)
  const { id } = useParams()
  const idValue = id ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUserName] = useState('')
  const [first_name, setFirst_name] = useState('')
  const [last_name, setLast_name] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  useEffect(() => {
    async function getGroups() {
      const res = await api.getGroups(userData.token)
      setGroups(res || [])
    }
    getGroups()

    async function getPermissions() {
      const res = await api.getPermissions(userData.token)
      setPermissions(res || [])
    }
    getPermissions()

    async function getUserInfo() {
      if (idValue === '') return

      const user = await api.oneuser(userData.token, idValue)
      if (user) {
        setEmail(user.email)
        setUserName(user.username)
        setFirst_name(user.first_name)
        setLast_name(user.last_name)
        setIsActive(user.is_active)
        setIsSuperuser(user.is_superuser)

        const userGroups = user.groups ? user.groups.split('|') : []

        setGroups((prevGroups) =>
          prevGroups.map((group) => ({
            ...group,
            checked: userGroups.includes(group.name),
          }))
        )

        const userPermissions = user.permissions
          ? user.permissions.split('|')
          : []

        setPermissions((prevPermisisons) =>
          prevPermisisons.map((permission) => ({
            ...permission,
            checked: userPermissions.includes(permission.name),
          }))
        )
      }
    }
    getUserInfo()
  }, [userData, idValue])

  function handleSubmit() {
    const groupNames = groups
      .filter((group) => group.checked)
      .map((group) => group.name)
      .join('|')

    const permissionNames = permissions
      .filter((permission) => permission.checked)
      .map((permission) => permission.name)
      .join('|')

    const updatedUser: NewUser = {
      password: password,
      email: email,
      first_name: first_name,
      last_name: last_name,
      username: username || email,
      is_active: isActive,
      is_superuser: isSuperuser,
      groups: groupNames,
      permissions: permissionNames,
    }



    api.editoneuser(userData.token, idValue, updatedUser, setToast)
    api.editoneuserGroups(userData.token, idValue, groups, setToast)
  }

  return (
    <UserForm
      headText="Manage User"
      userId={idValue}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      username={username}
      setUserName={setUserName}
      first_name={first_name}
      setFirst_name={setFirst_name}
      last_name={last_name}
      setLast_name={setLast_name}
      isActive={isActive}
      setIsActive={setIsActive}
      isSuperuser={isSuperuser}
      setIsSuperuser={setIsSuperuser}
      groups={groups}
      setGroups={setGroups}
      permissions={permissions}
      setPermissions={setPermissions}
      handleSubmit={handleSubmit}
    />
  )
}
