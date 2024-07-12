import { useContext, useEffect, useState } from 'react'
import api from '../util/api'
import { useNavigate } from 'react-router-dom'
import { MainContext } from '../App'
import Button from '../stylecomponents/Button'

export default function Login() {
  const { setUserData, setToast } = useContext(MainContext)
  const navigate = useNavigate()
  //const { userData } = useContext(MainContext);
  const [needstfa, setNeedstfa] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tfa, setTfa] = useState('')

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

  async function handleSubmit() {
    // Implement login logic here (e.g., make an HTTP request to your Django backend)
    const response = await api.login(email, password, tfa, setToast)

    if (response && response.token) {
      setUserData({
        email: response.email,
        token: response.token,
      })

      sessionStorage.setItem(
        'userData',
        JSON.stringify({
          email: response.email,
          token: response.token,
        })
      )
      navigate('/')
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="bg-section p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
          <div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Email
            </label>
            <div className="relative mb-4">
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Email"
              />
            </div>
            <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
              Password
            </label>
            <div className="relative mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Password"
              />
            </div>
            {needstfa && (
              <>
                <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                  2FA Digits
                </label>
                <div className="relative mb-4">
                  <input
                    type="password"
                    value={tfa}
                    onChange={(e) => setTfa(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="123456"
                  />
                </div>
              </>
            )}
            <Button kind="primary" onClick={handleSubmit}>
              Login
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
