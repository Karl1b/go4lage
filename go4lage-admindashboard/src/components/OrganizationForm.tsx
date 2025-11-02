import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { MainContext } from '../App'
import api from '../util/api'
import Button from '../stylecomponents/Button'

interface OrganizationFormProps {
  headText: string
  organizationId: string
  organizationName: string
  setOrganizationName: (name: string) => void
  email: string
  setEmail: (email: string) => void
  activeUntil: string
  setActiveUntil: (date: string) => void
  handleSubmit: () => void
}

export default function OrganizationForm({
  headText,
  organizationId,
  organizationName,
  setOrganizationName,
  email,
  setEmail,
  activeUntil,
  setActiveUntil,
  handleSubmit,
}: OrganizationFormProps) {
  const { t } = useTranslation()
  const { userData, setToast } = useContext(MainContext)

  function deleteOrganization() {
    api.deleteOrganization(userData.token, organizationId, setToast)
  }

  // Format date for input field (YYYY-MM-DD)
  function formatDateForInput(dateString: string) {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0]

  // Calculate status and days remaining
  const isActive = activeUntil && new Date(activeUntil) > new Date()
  const daysRemaining = activeUntil
    ? Math.ceil(
        (new Date(activeUntil).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <div className="bg-surface-primary rounded-lg border border-border-default p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        {headText}
      </h1>

      <div className="space-y-6">
        {/* Organization Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('OrganizationName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder={t('OrganizationNamePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Email')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder={t('OrganizationEmailPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('ActiveUntil')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formatDateForInput(activeUntil)}
              onChange={(e) => setActiveUntil(e.target.value)}
              min={today}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-text-muted">
              {t('ActiveUntilDescription')}
            </p>
          </div>
        </div>

        {/* Status Display */}
        {organizationId && activeUntil && (
          <div className="p-4 bg-surface-secondary rounded-lg border border-border-default">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              {t('Status')}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full w-fit ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isActive ? t('Active') : t('Expired')}
                </span>
              </div>

              {isActive && daysRemaining > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-full text-sm font-medium w-fit ${
                    daysRemaining <= 30
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {daysRemaining <= 30
                    ? t('ExpiresInDaysWarning', { days: daysRemaining })
                    : t('ExpiresInDays', { days: daysRemaining })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {userData.is_superuser && (
          <div className="flex gap-4 pt-4">
            <Button onClick={handleSubmit} kind="primary">
              {headText === 'Create Organization'
                ? t('CreateOrganization')
                : t('SaveChanges')}
            </Button>
            {headText !== 'Create Organization' && (
              <Button onClick={deleteOrganization} kind="danger">
                {t('DeleteOrganization')}
              </Button>
            )}
          </div>
        )}

        {!userData.is_superuser && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {t('OnlySuperusersCanModifyOrganizations')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
