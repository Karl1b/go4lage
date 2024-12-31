import { useState } from 'react'
import ButtonGroup from '../components/ButtonGroup'
import Logo from '../components/Logo'
import Logout from '../components/Logout'
import Button from '../stylecomponents/Button'
import { useNavigate } from 'react-router-dom'
import { ThemeToggle } from '../themecomps/ThemeToggle'

export default function Header() {
  //const { userData } = useContext(MainContext);
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky-top-0 bg-brand-secondary flex justify-center text-slate-100">
      <div className="hidden md:flex flex-col ">
        <div className="flex justify-around items-center w-screen mt-2 -mb-3">
          <Logo />
          <div
            className="cursor-pointer"
            onClick={() => {
              navigate('/')
            }}
          >
            <h1 className='header-title text-text-primary'>Admin dashboard</h1>
          </div>
          <div>
          <ThemeToggle />
        </div>

          <Logout />
        </div>

        <div className="flex justify-center w-full bg-section">
          <div className="flex justify-center w-full -mb-6 relative z-10">
            <ButtonGroup />
          </div>
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
        <div>
          <ThemeToggle />
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
          className={` font-semibold absolute top-[70px] right-0 md:hidden z-10 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          } md:translate-x-0 w-60 max-w-full h-[calc(100vh_-_3rem)] md:w-auto md:h-auto p-4 md:p-0 bg-brand-secondary md:static  flex flex-col md:flex-row gap-2 transition-transform md:transition-none`}
        >
          <ButtonGroup />
          <Logout />
        </nav>
      </div>
    </header>
  )
}
