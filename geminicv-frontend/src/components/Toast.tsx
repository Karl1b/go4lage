import { useContext, useEffect } from 'react'
import { MainContext } from '../App'

export default function Toast() {
  const { toast, setToast } = useContext(MainContext)

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false })
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [toast, setToast])

  return (
    <>
      {toast.show && (
        <div className={`fixed top-20 right-10 border-4 border-black p-4 rounded-lg  shadow-lg text-white ${toast.success ? 'bg-green-700' : 'bg-red-600'} transition-opacity duration-300 ease-in-out`}>
          <div className="font-bold font-lg">{toast.header}</div>
          <div>{toast.text}</div>
        </div>
      )}
    </>
  )
}
