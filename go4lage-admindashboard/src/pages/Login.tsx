import { useContext, useEffect, useState, FormEvent } from 'react'
import api from '../util/api'
import { useNavigate } from 'react-router-dom'
import { MainContext } from '../App'
import Button from '../stylecomponents/Button'
import logo from '../assets/go4lage-logo-plain.svg'
import goopher from '../assets/goopher.svg'
import { ThemeToggle } from '../themecomps/ThemeToggle'
import { useTranslation } from 'react-i18next'
export default function Login() {
  const { setUserData, setToast } = useContext(MainContext)
  const navigate = useNavigate()
  const [needstfa, setNeedstfa] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tfa, setTfa] = useState('')
  const { t } = useTranslation()
  useEffect(() => {
    async function getDashboardinfo() {
      try {
        const dashboardinfo = await api.dashboardinfo()
        setNeedstfa(dashboardinfo.tfa)
      } catch (err) {
        setNeedstfa(false)
      }
    }
    getDashboardinfo()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const response = await api.login(email, password, tfa, setToast)

    if (response && response.token) {
      setUserData({
        email: response.email,
        token: response.token,
        is_superuser: response.is_superuser,
        is_organizationadmin: response.is_organizationadmin,
        organization_id: response.organization_id,
        organization_name: response.organization_name,
      })

      sessionStorage.setItem(
        'userData',
        JSON.stringify({
          email: response.email,
          token: response.token,
          is_superuser: response.is_superuser,
          is_organizationadmin: response.is_organizationadmin,
          organization_id: response.organization_id,
          organization_name: response.organization_name,
        })
      )
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg transition-all duration-300 hover:shadow-2xl">
        {/* Header Section */}
        <div className="p-8 border-b border-border-default">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <img src={logo} className="w-20 h-20" alt="Logo" />
              <img src={goopher} className="w-20 h-20" alt="Goopher" />
            </div>
            <div className="flex">
              <ThemeToggle />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t('adminDashboard')}
          </h1>
          <p className="text-text-muted mt-2">{t('SignInToContinue')}</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('emailAddress')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-surface-tertiary 
                          text-text-primary placeholder-text-muted
                          focus:outline-none focus:ring-2 focus:ring-interactive-default focus:border-transparent
                          transition-colors duration-200"
                placeholder={t('enterYourEmail')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border-default bg-surface-tertiary 
                          text-text-primary placeholder-text-muted
                          focus:outline-none focus:ring-2 focus:ring-interactive-default focus:border-transparent
                          transition-colors duration-200"
                placeholder={t('enterYourPassword')}
              />
            </div>

            {needstfa && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('tfaCode')}
                </label>
                <input
                  type="text"
                  value={tfa}
                  onChange={(e) => setTfa(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border-default bg-surface-tertiary 
                            text-text-primary placeholder-text-muted
                            focus:outline-none focus:ring-2 focus:ring-interactive-default focus:border-transparent
                            transition-colors duration-200"
                  placeholder={t('enterSixDigitCode')}
                  maxLength={6}
                />
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              kind="primary"
              type="submit"
              className="w-full flex justify-center py-3 rounded-lg bg-interactive-default hover:bg-interactive-hover 
                        text-text-inverse font-medium transition-colors duration-200"
            >
              {t('signIn')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
