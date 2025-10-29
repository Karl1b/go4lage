import { useContext } from 'react'
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

  return (
    <div className="bg-surface-primary rounded-lg border border-border-default p-6">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">
        {headText}
      </h1>

      <div className="space-y-6">
        {/* Organization Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Acme Corporation"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="contact@organization.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Active Until
            </label>
            <input
              type="date"
              value={formatDateForInput(activeUntil)}
              onChange={(e) => setActiveUntil(e.target.value)}
              min={today}
              className="w-full rounded-lg border border-border-default px-4 py-2 text-text-primary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-text-muted">
              The date until which the organization subscription is active
            </p>
          </div>
        </div>

        {/* Status Display */}
        {organizationId && activeUntil && (
          <div className="p-4 bg-surface-secondary rounded-lg">
            <h3 className="text-sm font-medium text-text-secondary mb-2">
              Status
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  new Date(activeUntil) > new Date()
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              ></div>
              <span className="text-text-primary">
                {new Date(activeUntil) > new Date() ? 'Active' : 'Expired'}
              </span>
              {new Date(activeUntil) > new Date() && (
                <span className="text-text-muted text-sm">
                  (expires in{' '}
                  {Math.ceil(
                    (new Date(activeUntil).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {userData.is_superuser && (
          <div className="flex gap-4 pt-4">
            <Button onClick={handleSubmit} kind="primary">
              {headText === 'Create Organization'
                ? 'Create Organization'
                : 'Save Changes'}
            </Button>
            {headText !== 'Create Organization' && (
              <Button onClick={deleteOrganization} kind="danger">
                Delete Organization
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
