import { useContext, useState, useEffect, useCallback } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js'
import { MainContext } from '../App'
import api from '../util/api'
import { UserDetails } from '../util/types'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function AccessLogs() {
  const { userData } = useContext(MainContext)
  const [chartData, setChartData] = useState<
    ChartData<'line', (number | null)[], string>
  >({
    labels: [],
    datasets: [
      {
        label: 'Index Count',
        data: [],
        borderColor: '#42a5f5',
        backgroundColor: 'rgba(66, 165, 245, 0.5)',
      },
      {
        label: 'Imprint Count',
        data: [],
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  })

  const getLogs = useCallback(async (userData: UserDetails) => {
    const indexLogPromise = api.getLogs(userData.token, '/-')
    const imprintLogPromise = api.getLogs(userData.token, '/imprint')

    const [indexLogsRes, imprintLogsRes] = await Promise.all([
      indexLogPromise,
      imprintLogPromise,
    ])

    // Merge logs by matching dates
    const mergedLogs = indexLogsRes.map((indexLog) => {
      const imprintLog = imprintLogsRes.find(
        (imprint) => imprint.log_date === indexLog.log_date
      ) || { total_count: 0 }
      return {
        log_date: indexLog.log_date,
        index_count: indexLog.total_count,
        imprint_count: imprintLog.total_count,
      }
    })

    // Update the chart data using the merged logs
    setChartData({
      labels: mergedLogs.map((log) => log.log_date), // Set labels to the dates from mergedLogs
      datasets: [
        {
          label: 'Index Count',
          data: mergedLogs.map((log) => log.index_count),
          borderColor: '#42a5f5',
          backgroundColor: 'rgba(66, 165, 245, 0.5)',
        },
        {
          label: 'Imprint Count',
          data: mergedLogs.map((log) => log.imprint_count),
          borderColor: '#ff6384',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    })
  }, [])

  useEffect(() => {
    getLogs(userData)
  }, [userData, getLogs])

  return (
    <>
      <h2 className="text-xl font-bold">Logs Timeline</h2>
      <p>
        This is the daily total count of index hits versus the daily total
        counts of imprint hits. It gives an approximation of how many people are
        actually interested in the creator of the project.
      </p>
      <div className="flex justify-center">
        <Line data={chartData} />
      </div>
    </>
  )
}
