import { useNavigate } from 'react-router-dom'
import Button from '../stylecomponents/Button'

export default function ButtonGroup() {
  const navigate = useNavigate()

  return (
    <div className='flex flex-col space-y-2'>
      <Button
        kind="primary" 
        onClick={() => navigate('/createuser')}
        className="w-full"
      >
        Create user
      </Button>
      <Button
        kind="primary" 
        onClick={() => navigate('/bulkcreate')}
        className="w-full"
      >
        Bulk create
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/showusers')}
        className="w-full"
      >
        Show users
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/groupspermissions')}
        className="w-full"
      >
        Groups & Permissions
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/backups')}
        className="w-full"
      >
        Backups
      </Button>
      <Button
        kind="primary"
        onClick={() => navigate('/logs')}
        className="w-full"
      >
        Logs
      </Button>
    </div>
  )
}