import { useContext, useEffect, useState } from 'react'
import api from '../util/api'
import { MainContext } from '../App'
import { Group, NewUser, Permission } from '../util/types'
import UserForm from '../components/UserForm'

export default function CreateUser() {
  const { userData, setToast } = useContext(MainContext)

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
  }, [userData.token])

  function handleSubmit() {
    const groupNames = groups
      .filter((group) => group.checked)
      .map((group) => group.name)
      .join('|')

    const permissionNames = permissions
      .filter((permission) => permission.checked)
      .map((permission) => permission.name)
      .join('|')

    const newUser: NewUser = {
      email: email,
      password: password,
      first_name: first_name,
      last_name: last_name,
      username: username || email,
      is_active: isActive,
      is_superuser: isSuperuser,
      groups: groupNames,
      permissions: permissionNames,
    }

    api.createoneuser(userData.token, newUser,setToast)
  }

  return (
    <UserForm
      userId=''
      headText="Create user"
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
