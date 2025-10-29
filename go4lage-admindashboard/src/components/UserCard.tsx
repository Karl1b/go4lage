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
        className="bg-surface-secondary p-4 rounded-lg border border-border-default shadow-lg hover:bg-surface-tertiary transition-colors w-full"
        onClick={() => navigate(`/manageuser/${user.id}`)}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xl font-bold text-text-primary">
            {user.first_name} {user.last_name}
          </p>
          {user.organization && (
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
              {user.organization.organization_name}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Username</label>
            <p className="text-sm text-text-primary">{user.username}</p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Email</label>
            <p className="text-sm text-text-primary truncate" title={user.email}>
              {user.email}
            </p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Status</label>
            <div className="flex gap-2">
              {user.is_active ? (
                <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                  Active
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
                  Inactive
                </span>
              )}
              {user.is_superuser && (
                <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                  Super
                </span>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Created</label>
            <p className="text-sm text-text-primary text-nowrap">{formattedCreatedAt}</p>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Last Login</label>
            <p className="text-sm text-text-primary text-nowrap">{formattedLastLogin}</p>
          </div>
          
          <div className="col-span-2 xl:col-span-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">Groups</label>
            <p className="text-sm text-text-primary truncate" title={user.groups?.replace(/\|/g, ', ')}>
              {user.groups?.replace(/\|/g, ', ') || 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}