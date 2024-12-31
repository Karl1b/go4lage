import { useNavigate } from 'react-router-dom'
import { User } from '../util/types'
import { format } from 'date-fns'

export interface IUserCardProps {
  user: User
}

export default function UserCard({ user }: IUserCardProps) {
  const navigate = useNavigate()

  const formattedCreatedAt = format(new Date(user.created_at), 'dd.MM.yyyy HH:mm')
  const formattedLastLogin = format(new Date(user.last_login), 'dd.MM.yyyy HH:mm')

  return (
    <div className="flex justify-center cursor-pointer text-text-primary">
      <div
        className="bg-surface-secondary p-1 rounded-lg border border-border-default shadow-lg hover:bg-surface-tertiary transition-colors w-full"
        onClick={() => navigate(`/manageuser/${user.id}`)}
      >
        <p className="text-2xl font-bold text-center text-text-primary">{user.first_name} {user.last_name}</p>
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-8 gap-1">
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Username</label>
            <p className="text-text-secondary">{user.username}</p>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Email</label>
            <p className="text-text-secondary">{user.email}</p>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Active</label>
            <p className="text-text-secondary">{user.is_active ? 'Yes' : 'No'}</p>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Superuser</label>
            <p className="text-text-secondary">{user.is_superuser ? 'Yes' : 'No'}</p>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Created At</label>
            <p className="text-text-secondary text-nowrap">{formattedCreatedAt}</p>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Last Login</label>
            <p className="text-text-secondary text-nowrap">{formattedLastLogin}</p>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium leading-6 text-text-primary">Groups</label>
            <p className="text-text-secondary">{user.groups?.replace('|', ', ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
