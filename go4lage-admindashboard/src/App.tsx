import { createContext, useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastDetails, UserDetails } from './util/types'

import Header from './pages/Header'
import SideBar from './components/SideBar'
import Login from './pages/Login'
import Index from './pages/Index'
import CreateUser from './pages/CreateUser'
import BulkCreate from './pages/BulkCreate'
import ShowUsers from './pages/ShowUsers'
import Backups from './pages/Backups'
import Logs from './pages/Logs'
import ManageUser from './pages/ManageUser'
import GroupsPermissions from './pages/GroupsPermissions'
import ManageGroup from './pages/ManageGroup'
import ManagePermission from './pages/ManagePermission'
import Toast from './components/Toast'
import Accesslogs from './pages/Accesslogs'
import Errorlogs from './pages/Errorlogs'
import { ThemeProvider } from './themecomps/ThemeProvider'
import MyMessages from './pages/MyMessages'

interface IMainContext {
  toast: ToastDetails
  setToast: (value: ToastDetails) => void
  userData: UserDetails
  setUserData: (value: UserDetails) => void
}

export const MainContext = createContext<IMainContext>({
  userData: { email: null, token: null },
  toast: { show: false, success: true, text: '', header: '' },
  setUserData: () => {},
  setToast: () => {},
})

function App() {
  const [userData, setUserData] = useState<UserDetails>(
    getUserDataFromSession()
  )
  const [toast, setToast] = useState<ToastDetails>({
    show: false,
    success: true,
    header: '',
    text: '',
  })
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false)

  return (
    <>
      <ThemeProvider>
        <BrowserRouter>
          <MainContext.Provider
            value={{
              userData,
              setUserData,
              toast,
              setToast,
            }}
          >
            <div className="bg-surface-secondary min-h-screen">
              <Toast />
              {userData.email ? (
                <div className="flex h-screen overflow-hidden">
                  {/* Sidebar */}
                  <SideBar
                    isExpanded={isSidebarExpanded}
                    setIsExpanded={setIsSidebarExpanded}
                    isMobileOpen={isMobileOpen}
                    setIsMobileOpen={setIsMobileOpen}
                  />

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col">
                    {/* Header */}
                    <Header
                      isSidebarExpanded={isSidebarExpanded}
                      setIsMobileOpen={setIsMobileOpen}
                    />

                    {/* Page Content */}
                    <main className="flex overflow-y-auto bg-surface-secondary pt-16 justify-center">
                      <div className={isSidebarExpanded ? 'flex lg:pl-[288px]' : 'flex md:pl-20 lg:pl-14'}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/createuser" element={<CreateUser />} />
                          <Route path="/bulkcreate" element={<BulkCreate />} />
                          <Route path="/showusers" element={<ShowUsers />} />
                          <Route path="/backups" element={<Backups />} />
                          <Route path="/logs" element={<Logs />} />
                          <Route path="/accesslogs" element={<Accesslogs />} />
                          <Route path="/errorlogs" element={<Errorlogs />} />
                          <Route
                            path="/manageuser/:id"
                            element={<ManageUser />}
                          />
                          <Route
                            path="/managegroup/:id"
                            element={<ManageGroup />}
                          />
                          <Route
                            path="/managepermission/:id"
                            element={<ManagePermission />}
                          />
                          <Route
                            path="/groupspermissions"
                            element={<GroupsPermissions />}
                          />
                           <Route path="/mymessages" element={<MyMessages isAdmin={false} />} />
                           <Route path="/adminmessages" element={<MyMessages isAdmin={true} />} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </div>
              ) : (
                <Login />
              )}
            </div>
          </MainContext.Provider>
        </BrowserRouter>
      </ThemeProvider>
    </>
  )
}

export default App

function getUserDataFromSession(): UserDetails {
  const storedUserData = sessionStorage.getItem('userData')
  if (storedUserData) {
    return JSON.parse(storedUserData)
  } else {
    return { email: null, token: null }
  }
}
