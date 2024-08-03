import { useNavigate } from 'react-router-dom'
import { Group, Permission } from '../util/types'

export interface GPProps {
  isGroup: boolean
  item: Group | Permission
}

export default function GPcard({ item, isGroup }: GPProps) {
  const navigate = useNavigate()

  const handleNavigation = () => {
    if (isGroup) {
      navigate(`/managegroup/${item.id}`)
    } else {
      navigate(`/managepermission/${item.id}`)
    }
  }

  return (
    <div
      className="flex justify-center cursor-pointer"
      onClick={handleNavigation}
    >
      <div className="bg-gray-300 p-4 rounded-lg border shadow-lg hover:bg-gray-100 transition-colors w-full">
        <p className="text-2xl font-bold text-center">{item.name}</p>
      </div>
    </div>
  )
}
