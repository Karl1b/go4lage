import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User } from '../util/types'
import { format } from 'date-fns'

export interface IUserCardProps {
  user: User
}

export default function UserCard({ user }: IUserCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const formattedCreatedAt = format(
    new Date(user.created_at),
    'dd.MM.yyyy HH:mm'
  )
  const formattedLastLogin = format(
    new Date(user.last_login),
    'dd.MM.yyyy HH:mm'
  )

  return (
    <div className="flex justify-center cursor-pointer text-text-primary mb-4">
      <div
        className="bg-surface-secondary p-4 rounded-lg border border-border-default shadow-lg hover:bg-surface-tertiary transition-colors w-full"
        onClick={() => navigate(`/manageuser/${user.id}`)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <p className="text-xl font-bold text-text-primary">
            {user.first_name} {user.last_name}
          </p>
          {user.organization && (
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full w-fit">
              {user.organization.organization_name}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          <div className="min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('Username')}
            </label>
            <p
              className="text-sm text-text-primary truncate"
              title={user.username}
            >
              {user.username}
            </p>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('Email')}
            </label>
            <p
              className="text-sm text-text-primary truncate"
              title={user.email}
            >
              {user.email}
            </p>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('Status')}
            </label>
            <div className="flex gap-2 flex-wrap">
              {user.is_active ? (
                <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded whitespace-nowrap">
                  {t('Active')}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded whitespace-nowrap">
                  {t('Inactive')}
                </span>
              )}
              {user.is_superuser && (
                <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded whitespace-nowrap">
                  {t('Super')}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('Created')}
            </label>
            <p className="text-sm text-text-primary whitespace-nowrap">
              {formattedCreatedAt}
            </p>
          </div>

          <div className="min-w-0">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('LastLogin')}
            </label>
            <p className="text-sm text-text-primary whitespace-nowrap">
              {formattedLastLogin}
            </p>
          </div>

          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {t('Groups')}
            </label>
            <p
              className="text-sm text-text-primary truncate"
              title={user.groups?.replace(/\|/g, ', ')}
            >
              {user.groups?.replace(/\|/g, ', ') || t('None')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
