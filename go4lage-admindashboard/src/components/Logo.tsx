import { useNavigate } from 'react-router-dom'
import logo from '../assets/go4lage-logo-plain.svg'

export default function Logo() {
  const navigate = useNavigate()

  return (
    <>
      <div
        className="m-0 cursor-pointer -mb-2"
        onClick={() => {
          navigate('/')
        }}
      >
        <img src={logo} width="100px" />
      </div>
    </>
  )
}
