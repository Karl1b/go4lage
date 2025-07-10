import { useNavigate } from 'react-router-dom'
import Button from '../stylecomponents/Button'
import { useTranslation } from 'react-i18next'

export default function ButtonGroup() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col space-y-2">
      <Button
        kind="primary"
        onClick={() => navigate('/createuser')}
        className="w-full"
      >
        {t('CreateUser')}
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/bulkcreate')}
        className="w-full"
      >
        {t('BulkCreate')}
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/showusers')}
        className="w-full"
      >
        {t('ShowUsers')}
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/groupspermissions')}
        className="w-full"
      >
        {t('GroupsPermissions')}
      </Button>

      <Button
        kind="primary"
        onClick={() => navigate('/adminmessages')}
        className="w-full"
      >
        {t('UserFeedback')}
      </Button>
    </div>
  )
}
