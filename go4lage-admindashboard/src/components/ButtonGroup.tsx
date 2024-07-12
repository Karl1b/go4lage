import { useNavigate } from 'react-router-dom'
import Button from '../stylecomponents/Button'

export default function ButtonGroup() {
  const navigate = useNavigate()
  //const { userData } = useContext(MainContext);
  return (
    <>
      <Button
        kind="primary"
        onClick={() => {
          navigate('/createuser')
        }}
      >
        Create user
      </Button>
      <Button
        kind="primary"
        onClick={() => {
          navigate('/bulkcreate')
        }}
      >
        Bulk create
      </Button>

      <Button
        kind="primary"
        onClick={() => {
          navigate('/showusers')
        }}
      >
        Show users
      </Button>

      <Button
        kind="primary"
        onClick={() => {
          navigate('/groupspermissions')
        }}
      >
        Groups & Permissions
      </Button>

      <Button
        kind="primary"
        onClick={() => {
          navigate('/backups')
        }}
      >
        Backups
      </Button>

      <Button
        kind="primary"
        onClick={() => {
          navigate('/logs')
        }}
      >
        Logs
      </Button>
    </>
  )
}
