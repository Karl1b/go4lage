import { useContext, useEffect, useState } from 'react'
import api from '../util/api'
import { MainContext } from '../App'
import { Group, NewUser, Permission, OrganizationT } from '../util/types'
import UserForm from '../components/UserForm'
import { useTranslation } from 'react-i18next'

export default function CreateUser() {
  const { userData, setToast } = useContext(MainContext)
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUserName] = useState('')
  const [first_name, setFirst_name] = useState('')
  const [last_name, setLast_name] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isSuperuser, setIsSuperuser] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationT[]>([])

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

    async function getOrganizations() {
      const res = await api.allOrganizations(userData.token)
      setOrganizations(res || [])
    }
    getOrganizations()
  }, [userData.token])

  function handleSubmit() {
    // Validate organization requirement
    if (!isSuperuser && !organizationId) {
      setToast({
        header: t('validationError'),
        text: t('usersNotSuperuserMustBelongToOrganization'),
        success: false,
        show: true,
      })
      return
    }

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
      organization_id: organizationId,
    }

    api.createoneuser(userData.token, newUser, setToast)
  }

  return (
    <UserForm
      userId=""
      headText={t('createUser')}
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
      organizationId={organizationId}
      setOrganizationId={setOrganizationId}
      organizations={organizations}
      handleSubmit={handleSubmit}
    />
  )
}
