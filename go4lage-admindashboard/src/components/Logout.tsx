import { useContext } from 'react'
import { MainContext } from '../App'
import { UserDetails } from '../util/types'
import Button from '../stylecomponents/Button'
import api from '../util/api'

export default function Logout() {
  const { userData, setUserData } = useContext(MainContext)

  async function logout() {
    if (!userData.token) {
      return
    }
    try {
      await api.logout(userData.token)
    } catch (e) {
      console.log(e)
    } finally {
      const emptyUser: UserDetails = { email: null, token: null, is_organizationadmin: false, is_superuser: false }
      setUserData(emptyUser)
    }
  }

  return (
    <>
      <Button onClick={logout} kind="secondary">
        Logout
      </Button>
    </>
  )
}
