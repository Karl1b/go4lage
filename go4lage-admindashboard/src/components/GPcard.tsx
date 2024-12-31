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
      <div className="bg-surface-primary m-2 p-1 rounded-lg border-2 border-border-default shadow-lg hover:bg-surface-primary/90 transition-colors w-full">
        <p className="text-2xl font-bold text-center text-text-primary">{item.name}</p>
      </div>
    </div>
  )
}
