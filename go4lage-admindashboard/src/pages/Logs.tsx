import { useNavigate } from 'react-router-dom'
import logo from '../assets/go4lage-logo-plain.svg'

export default function Logo() {
  const navigate = useNavigate()

  return (
    <div
      className="cursor-pointer flex items-center justify-center w-12 h-12"
      onClick={() => navigate('/')}
    >
      <img src={logo} alt="Logo" className="w-10 h-10" />
    </div>
  )
}