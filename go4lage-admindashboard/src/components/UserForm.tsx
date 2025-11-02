import { Group, Permission, OrganizationT } from '../util/types'
import Checkbox from '../components/Checkbox'
import api from '../util/api'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MainContext } from '../App'
import Button from '../stylecomponents/Button'
import MaskedInput from './MaskedInput'
import { FaInfoCircle } from 'react-icons/fa'

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
  organizationId: string | null
  setOrganizationId: (orgId: string | null) => void
  organizations: OrganizationT[]
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
  organizationId,
  setOrganizationId,
  organizations,
  handleSubmit,
}: UserFormProps) {
  const { t } = useTranslation()
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

  // Show warning if organization is required but not selected
  const organizationRequired = !isSuperuser
  const showOrgWarning = organizationRequired && !organizationId

  return (
    <div className="bg-surface-primary rounded-lg border border-border-default p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        {headText}
      </h1>

      <div className="space-y-6">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder={t('EmailPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Password')}
            </label>
            <MaskedInput password={password} setPassword={setPassword} />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder={t('UsernamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('FirstName')}
            </label>
            <input
              type="text"
              value={first_name}
              onChange={(e) => setFirst_name(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder={t('FirstNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('LastName')}
            </label>
            <input
              type="text"
              value={last_name}
              onChange={(e) => setLast_name(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder={t('LastNamePlaceholder')}
            />
          </div>
        </div>

        {/* Organization Selection */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            {t('Organization')}{' '}
            {organizationRequired && <span className="text-red-500">*</span>}
          </label>
          <select
            value={organizationId || ''}
            onChange={(e) => setOrganizationId(e.target.value || null)}
            className={`w-full rounded-lg border ${
              showOrgWarning ? 'border-red-500' : 'border-border-default'
            } px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent`}
            disabled={isSuperuser}
          >
            <option value="">{t('NoOrganization')}</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id || ''}>
                {org.organization_name}
              </option>
            ))}
          </select>
          {showOrgWarning && (
            <p className="mt-1 text-sm text-red-500">
              {t('OrganizationRequiredWarning')}
            </p>
          )}
          {isSuperuser && (
            <p className="mt-1 text-sm text-text-muted">
              {t('OrganizationOptionalForSuperusers')}
            </p>
          )}
        </div>

        {/* Status Options */}
        <div className="flex gap-6 p-4 bg-surface-secondary rounded-lg">
          <Checkbox
            label={t('IsActive')}
            checked={isActive}
            onChange={() => setIsActive(!isActive)}
          />
          <Checkbox
            label={t('IsSuperuser')}
            checked={isSuperuser}
            onChange={() => {
              setIsSuperuser(!isSuperuser)
              // Clear organization requirement warning when becoming superuser
              if (!isSuperuser && !organizationId) {
                // User is becoming a superuser, no org required
              }
            }}
          />
        </div>

        {/* Groups Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-medium text-text-primary">
              {t('Groups')}
            </h2>
            <FaInfoCircle
              className="w-5 h-5 text-accent-primary cursor-pointer hover:text-accent-secondary"
              onClick={() => setShowGroupInfo(!showGroupInfo)}
            />
          </div>

          {showGroupInfo && (
            <div className="mb-4 p-4 bg-info/10 rounded-lg text-text-primary">
              <p className="mb-2">{t('GroupDescription1')}</p>
              <p>{t('GroupDescription2')}</p>
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
            <h2 className="text-lg font-medium text-text-primary">
              {t('PurePermissions')}
            </h2>
            <FaInfoCircle
              className="w-5 h-5 text-accent-primary cursor-pointer hover:text-accent-secondary"
              onClick={() => setShowPermInfo(!showPermInfo)}
            />
          </div>

          {showPermInfo && (
            <div className="mb-4 p-4 bg-info/10 rounded-lg text-text-primary">
              <p className="mb-2">{t('PurePermissionsDescription1')}</p>
              <p>{t('PurePermissionsDescription2')}</p>
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
            {headText === 'Create user' ? t('CreateUser') : t('SaveChanges')}
          </Button>
          {headText !== 'Create user' && (
            <Button onClick={deleteUser} kind="danger">
              {t('DeleteUser')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
