import { useNavigate } from 'react-router-dom'
import Button from '../stylecomponents/Button'

export default function Logs() {
  const navigate = useNavigate()

  return (
    <>
      <div className="flex justify-center mt-10">
        <h1 className="m-0 p-0 text-text-primary">Logs</h1>
      </div>
      <div className="flex justify-center mt-6">
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
