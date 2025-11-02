import { useContext, useState } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import { OrganizationT } from '../util/types'
import OrganizationForm from '../components/OrganizationForm'
import { useTranslation } from 'react-i18next'

export default function CreateOrganization() {
  const { userData, setToast } = useContext(MainContext)
  const { t } = useTranslation()

  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [activeUntil, setActiveUntil] = useState('2999-01-01')

  function handleSubmit() {
    const newOrganization: OrganizationT = {
      organization_name: organizationName,
      email: email,
      active_until: activeUntil,
    }

    api.createOrganization(userData.token, newOrganization, setToast)
  }

  return (
    <OrganizationForm
      headText={t('createOrganization')}
      organizationId=""
      organizationName={organizationName}
      setOrganizationName={setOrganizationName}
      email={email}
      setEmail={setEmail}
      activeUntil={activeUntil}
      setActiveUntil={setActiveUntil}
      handleSubmit={handleSubmit}
    />
  )
}
