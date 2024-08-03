import { useContext, useEffect, useState } from 'react'
import { MainContext } from '../App'
import api from '../util/api'
import { Backup, UserDetails } from '../util/types'
import BackupCard from '../components/BackupCard'
import Button from '../stylecomponents/Button'

export default function Backups() {
  const { userData, setToast } = useContext(MainContext)

  const [backups, setBackups] = useState<Backup[]>([])

  function createBackup() {

    api.createBackup(userData.token,setToast).then(()=>{getBackups(userData)})

  }

  async function getBackups(userData: UserDetails) {
    const res = await api.getBackups(userData.token)
    setBackups(res || [])
  }

  useEffect(() => {
    getBackups(userData)
  }, [userData])

  return (
    <>
      <h1 className="p-2 text-center">Backups</h1>
      <div className="flex justify-center">
        <Button
        kind='primary'
          onClick={createBackup}
          
        >
          Create Backup
        </Button>
      </div>

      <div className="">
        {backups?.map((backup:Backup) => {
          return (
            <BackupCard key={backup.file_name} backup={backup} getBackups={() => getBackups(userData)}/>
          )
        })}
      </div>
    </>
  )
}
