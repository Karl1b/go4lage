import { useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Logo from '../components/Logo'
import Logout from '../components/Logout'
import Button from '../stylecomponents/Button'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  //const { userData } = useContext(MainContext);
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky-top-0 bg-header flex justify-center text-slate-100">
      <div className="hidden md:flex flex-col ">
        <div className="flex justify-around items-center w-screen">
          <Logo />
          <div
            className="cursor-pointer"
            onClick={() => {
              navigate('/')
            }}
          >
            <h1 className='header-title'>Admin dashboard</h1>
          </div>

          <Logout />
        </div>
        <div className="flex justify-center font-semibold w-sceen items-center bg-secondheader">
          <ButtonGroup />
        </div>
      </div>

      <div
        className="md:hidden flex justify-between items-center"
        style={{ width: '100vw' }}
      >
        <Logo />
        <div>
          <h3>Admin Dashboard</h3>
        </div>
        <Button
          kind="primary"
          className="md:hidden m-4"
          onClick={() => {
            setMenuOpen(!menuOpen)
          }}
        >
          Menu
        </Button>
      </div>

      <div>
        <nav
          className={` font-semibold absolute top-[60px] right-0 md:hidden z-10 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          } md:translate-x-0 w-60 max-w-full h-[calc(100vh_-_3rem)] md:w-auto md:h-auto p-4 md:p-0 bg-gradient-custom md:static md:bg-transparent flex flex-col md:flex-row gap-2 transition-transform md:transition-none`}
        >
          <ButtonGroup />
          <Logout />
        </nav>
      </div>
    </header>
  )
}
