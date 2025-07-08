import { useNavigate } from 'react-router-dom'
import logo from '../assets/go4lage-logo-plain.svg'

export default function Logo() {
  const navigate = useNavigate()

  return (
    <div
      className="cursor-pointer flex items-center justify-center transition-transform hover:scale-105 active:scale-95 h-10 overflow-hidden"
      onClick={() => navigate('/')}
    >
      <img 
        src={logo} 
        alt="Go4lage Logo"
        className="h-full w-auto max-w-20 object-contain"
        style={{ maxHeight: '40px' }}
      />
    </div>
  )
}