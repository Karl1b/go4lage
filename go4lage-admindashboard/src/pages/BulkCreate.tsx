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
      if (!blob) {
        return
      }

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
    <div className="flex flex-col items-center mt-10">
      <h1 className="mb-4 p-2 text-text-primary text-2xl font-semibold">
        Bulk create users
      </h1>

      <div className="mb-6" onClick={handleDownloadTemplate}>
        <Button
          kind="secondary"
          className="hover:bg-surface-tertiary transition-colors"
        >
          Download CSV template
        </Button>
      </div>

      <form
        id="bulk_createForm"
        ref={formRef}
        className="w-full max-w-sm space-y-6"
        onSubmit={handleBulkCreateUsers}
      >
        <div className="mb-4">
          <label
            htmlFor="upload_csv"
            className="block text-text-primary font-medium mb-2"
          >
            Upload CSV with userdata
          </label>
          <input
            type="file"
            id="upload_csv"
            name="upload_csv"
            required
            accept=".csv"
            className="mt-2 block w-full text-text-primary
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-text-primary file:bg-surface-secondary
              file:cursor-pointer
              hover:file:bg-surface-tertiary
              transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center space-x-3 text-text-primary">
            <input
              type="checkbox"
              id="do_send_email"
              name="do_send_email"
              defaultChecked
              className="h-5 w-5 rounded border-border-default 
                text-interactive-default 
                focus:ring-interactive-default"
            />
            <span className="font-medium">
              Send email to new users with login Info?
            </span>
          </label>
        </div>

        <Button
          kind="primary"
          type="submit"
          className="w-full bg-interactive-default hover:bg-interactive-hover 
            text-text-inverse font-semibold
            focus:ring-2 focus:ring-interactive-default focus:ring-offset-2
            transition-colors"
        >
          Bulk create
        </Button>
      </form>
    </div>
  )
}
