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
    <div className='mt-10'>
      <h1 className="m-0 p-0 text-center text-text-primary">Backups</h1>
      <div className="flex justify-center mt-6">
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
    </div>
  )
}
