import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MainContext } from '../App'
import api from '../util/api'
import { OrganizationT } from '../util/types'
import OrganizationForm from '../components/OrganizationForm'
import { useTranslation } from 'react-i18next'

export default function ManageOrganization() {
  const { userData, setToast } = useContext(MainContext)
  const { t } = useTranslation()
  const { id } = useParams()
  const idValue = id ?? ''

  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [activeUntil, setActiveUntil] = useState('')

  useEffect(() => {
    async function getOrganizationInfo() {
      if (idValue === '') return

      const organization = await api.oneOrganization(userData.token, idValue)
      if (organization) {
        setOrganizationName(organization.organization_name)
        setEmail(organization.email)
        setActiveUntil(organization.active_until)
      }
    }
    getOrganizationInfo()
  }, [userData, idValue])

  function handleSubmit() {
    const updatedOrganization: OrganizationT = {
      organization_name: organizationName,
      email: email,
      active_until: activeUntil,
    }

    api.editOneOrganization(
      userData.token,
      idValue,
      updatedOrganization,
      setToast
    )
  }

  return (
    <OrganizationForm
      headText={t('manageOrganization')}
      organizationId={idValue}
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
