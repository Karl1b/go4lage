import { useContext, useState } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import { Backup } from '../util/types'
import Button from '../stylecomponents/Button'

export interface BackupCardProps {
  backup: Backup
  getBackups: () => void
}

export default function GPcard({ backup, getBackups }: BackupCardProps) {
  const { userData } = useContext(MainContext)

  const [isDelOpen, setIsDelOpen] = useState<boolean>(false)

  async function downloadBackup() {
    if (!userData.token) {
      return
    }
    try {
      const blob = await api.downloadBackup(userData.token, backup.file_name)
      if (!blob) {
        return
      } 
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backup.file_name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading CSV template:', error)
    }
  }

  async function deleteBackup() {
    await api.deletebackup(userData.token, backup.file_name)
    getBackups()
  }

  return (
    <div className="flex justify-center cursor-pointer">
      <div className="bg-gray-300 p-4 rounded-lg border shadow-lg hover:bg-gray-100 transition-colors w-full flex justify-around items-center">
        <p className="text-2xl font-bold text-center">{backup.file_name}</p>

        <Button onClick={downloadBackup} kind="primary">
          Download
        </Button>

        {isDelOpen ? (
          <Button onClick={deleteBackup} kind="danger">
            Confirm Delete
          </Button>
        ) : (
          <Button onClick={() => setIsDelOpen(true)} kind="secondary">
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}
