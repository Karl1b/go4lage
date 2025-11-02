import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { OrganizationT } from '../util/types'
import { FaBuilding, FaEnvelope, FaCalendarAlt, FaEdit } from 'react-icons/fa'

export default function OrganizationCard({
  organization,
}: {
  organization: OrganizationT
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Calculate status
  const isActive = new Date(organization.active_until) > new Date()
  const daysRemaining = Math.ceil(
    (new Date(organization.active_until).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  )

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      className="bg-surface-secondary border border-border-default rounded-lg p-4 mb-3 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/manageorganization/${organization.id}`)}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <FaBuilding className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3
                className="text-lg font-semibold text-text-primary truncate mb-1"
                title={organization.organization_name}
              >
                {organization.organization_name}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  {isActive ? t('Active') : t('Expired')}
                </div>
                {isActive && daysRemaining <= 30 && (
                  <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                    {t('ExpiresInDaysWarning', { days: daysRemaining })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
            <div className="flex items-center gap-2 text-text-secondary min-w-0">
              <FaEnvelope className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate" title={organization.email}>
                {organization.email}
              </span>
            </div>

            <div className="flex items-center gap-2 text-text-secondary">
              <FaCalendarAlt className="w-4 h-4 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-text-muted">
                  {t('ActiveUntilLabel')}:{' '}
                </span>
                <span className="font-medium text-text-primary whitespace-nowrap">
                  {formatDate(organization.active_until)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/manageorganization/${organization.id}`)
          }}
          className="self-start p-2 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex-shrink-0"
          aria-label={t('EditOrganization')}
        >
          <FaEdit className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
