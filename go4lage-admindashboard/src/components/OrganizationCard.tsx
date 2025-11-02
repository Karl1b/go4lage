import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { OrganizationT } from '../util/types'
import { FaBuilding, FaEnvelope, FaCalendarAlt, FaEdit } from 'react-icons/fa'

export default function OrganizationCard({ organization }: { organization: OrganizationT }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Calculate status
  const isActive = new Date(organization.active_until) > new Date()
  const daysRemaining = Math.ceil(
    (new Date(organization.active_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-surface-secondary border border-border-default rounded-lg p-4 mb-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FaBuilding className="text-accent-primary w-5 h-5" />
            <h3 className="text-lg font-semibold text-text-primary">
              {organization.organization_name}
            </h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                {isActive ? t('Active') : t('Expired')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div className="flex items-center gap-2 text-text-secondary">
              <FaEnvelope className="w-4 h-4" />
              <span className="text-sm">{organization.email}</span>
            </div>

            <div className="flex items-center gap-2 text-text-secondary">
              <FaCalendarAlt className="w-4 h-4" />
              <div className="text-sm">
                <span>{t('ActiveUntilLabel')}: </span>
                <span className="font-medium">{formatDate(organization.active_until)}</span>
              </div>
            </div>

            {isActive && daysRemaining <= 30 && (
              <div className="text-sm text-orange-600 font-medium">
                {t('ExpiresInDaysWarning', { days: daysRemaining })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => navigate(`/manageorganization/${organization.id}`)}
          className="ml-4 p-2 text-text-secondary hover:text-text-primary hover:bg-surface-tertiary rounded-lg transition-colors duration-200"
          aria-label={t('EditOrganization')}
        >
          <FaEdit className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}