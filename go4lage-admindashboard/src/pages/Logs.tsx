import { useNavigate } from 'react-router-dom'
import Button from '../stylecomponents/Button'

export default function Logs() {
  const navigate = useNavigate()

  return (
    <>
      <div className="flex justify-center">
        <h1 className="">Logs</h1>
      </div>
      <div className="flex justify-center">
        <Button
          kind="primary"
          onClick={() => {
            navigate('/accesslogs')
          }}
        >
          Access logs
        </Button>

        <Button
          kind="primary"
          onClick={() => {
            navigate('/errorlogs')
          }}
        >
          Error logs
        </Button>
      </div>
    </>
  )
}
