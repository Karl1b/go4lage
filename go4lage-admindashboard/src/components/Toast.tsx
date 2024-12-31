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
        <div
          className={`
            fixed top-20 right-20 
            border-2 border-border-default 
            p-6 rounded-lg shadow-lg 
            ${toast.success ? 'bg-success' : 'bg-error'} 
            transition-opacity duration-300 ease-in-out
            animate-[pulse_0.5s_ease-in-out]
          `}
        >
          <div className="font-bold text-lg text-text-primary">
            {toast.header}
          </div>
          <div className="mt-1 text-text-primary">{toast.text}</div>
        </div>
      )}
    </>
  )
}
