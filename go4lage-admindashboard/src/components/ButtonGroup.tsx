import { useNavigate } from 'react-router-dom'
import Button from '../stylecomponents/Button'
import { useTranslation } from 'react-i18next'
import { useContext } from 'react'
import { MainContext } from '../App'
export default function ButtonGroup() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { userData } = useContext(MainContext)
  return (
    <div className="flex flex-col space-y-2">
      {(userData.is_organizationadmin || userData.is_superuser) && (
        <Button
          kind="primary"
          onClick={() => navigate('/showusers')}
          className="w-full"
        >
          {t('ShowUsers')}
        </Button>
      )}

      {(userData.is_organizationadmin || userData.is_superuser) && (
        <Button
          kind="primary"
          onClick={() => navigate('/showorganizations')}
          className="w-full"
        >
          {t('ShowOrganizations')}
        </Button>
      )}

      {userData.organization_id && (userData.is_organizationadmin || userData.is_superuser) && (
        <Button
          kind="primary"
          onClick={() =>
            navigate(`/manageorganization/${userData.organization_id}`)
          }
          className="w-full"
        >
          {t('ShowMyOrganization')}
        </Button>
      )}
      {userData.is_superuser && (
        <Button
          kind="primary"
          onClick={() => navigate('/adminmessages')}
          className="w-full"
        >
          {t('UserFeedback')}
        </Button>
      )}
    </div>
  )
}
