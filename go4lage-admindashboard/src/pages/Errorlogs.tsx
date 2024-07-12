import { useContext, useEffect, useState } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import { LogDetail, UserDetails } from '../util/types'

export default function ShowUsers() {
  const { userData } = useContext(MainContext)
  const [logs, setLogs] = useState<LogDetail[]>([])

  async function getBackups(userData: UserDetails) {
    const res = await api.getErrorLogs(userData.token)
    setLogs(res || [])
  }

  useEffect(() => {
    getBackups(userData)
  }, [userData])

  return (
    <>
      <h2 className="text-xl font-bold text-center my-4">Error Logs</h2>
      <div className="space-y-4 mx-4">
        {logs?.map((log: LogDetail, i) => (
          <div key={i} className="bg-white shadow-md rounded-lg p-4">
            <p className="text-gray-600">
              <span className="font-bold">Timestamp:</span>{' '}
              {new Date(log.timestamp).toLocaleString()}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Client IP:</span> {log.client_ip}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Method:</span> {log.request_method}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">URI:</span> {log.request_uri}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Protocol:</span>{' '}
              {log.request_protocol}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Status Code:</span> {log.status_code}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Duration:</span>{' '}
              {log.response_duration}ms
            </p>
            <p className="text-gray-600">
              <span className="font-bold">User Agent:</span> {log.user_agent}
            </p>
            <p className="text-gray-600">
              <span className="font-bold">Referrer:</span> {log.referrer}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
