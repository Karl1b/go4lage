import React, { useContext, useRef } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import Button from '../stylecomponents/Button'

export default function BulkCreateUsers() {
  const formRef = useRef<HTMLFormElement>(null)
  const { userData, setToast } = useContext(MainContext)

  const handleDownloadTemplate = async (event: React.MouseEvent) => {
    event.preventDefault()
    if (!userData.token) {
      return
    }
    try {
      const blob = await api.downloadCSVtemplate(userData.token)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'user_template.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading CSV template:', error)
    }
  }

  const handleBulkCreateUsers = async (event: React.FormEvent) => {
    event.preventDefault()
    if (formRef.current && userData.token) {
      const formData = new FormData(formRef.current)
      try {
        await api.bulkCreateUsers(userData.token, formData, setToast)
      } catch (error) {
        console.error('Error creating users:', error)
      }
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h4 className="mb-4 p-2 text-2xl font-bold">Bulk create users</h4>
      <div onClick={handleDownloadTemplate}>
        <Button
          kind="secondary"
  
        >
          Download CSV template
        </Button>
      </div>
      <form
        id="bulk_createForm"
        ref={formRef}
        className="w-full max-w-sm"
        onSubmit={handleBulkCreateUsers}
      >
        <div className="mb-4">
          <label htmlFor="upload_csv" className="block text-gray-700">
            Upload CSV with userdata
          </label>
          <input
            type="file"
            id="upload_csv"
            name="upload_csv"
            required
            className="mt-2 block w-full"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="do_send_email" className="block text-gray-700">
            Send email to new users with login Info?
          </label>
          <input
            type="checkbox"
            id="do_send_email"
            name="do_send_email"
            defaultChecked
            className="mt-2"
          />
        </div>
        
        <Button
        kind='primary'
        >
      
        <button
          type="submit"
          
          >
          Bulk create
        </button>
          </Button>
      </form>
    </div>
  )
}
