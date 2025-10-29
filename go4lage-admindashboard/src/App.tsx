import { createContext, useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastDetails, UserDetails } from './util/types'

import Header from './pages/Header'
import SideBar from './components/SideBar'
import Login from './pages/Login'
import Index from './pages/Index'
import CreateUser from './pages/CreateUser'
import ShowUsers from './pages/ShowUsers'

import ManageUser from './pages/ManageUser'
import Toast from './components/Toast'

import { ThemeProvider } from './themecomps/ThemeProvider'
import MyMessages from './pages/MyMessages'
import ManageOrganization from './pages/ManageOrganization'
import CreateOrganization from './pages/CreateOrganization'
import ShowOrganizations from './pages/ShowOrganizations'

interface IMainContext {
  toast: ToastDetails
  setToast: (value: ToastDetails) => void
  userData: UserDetails
  setUserData: (value: UserDetails) => void
}

export const MainContext = createContext<IMainContext>({
  userData: {
    email: null, token: null,
    is_superuser: false,
    is_organizationadmin: false,
  },
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
                    <main className="flex overflow-y-auto pt-16 justify-center">
                      <div
                        className={
                          isSidebarExpanded
                            ? 'flex lg:pl-[288px]'
                            : 'flex md:pl-20 lg:pl-14'
                        }
                      >
                        <Routes>
                          <Route path="/" element={<Index />} />

                           {/* USERS */}
                          <Route path="/createuser" element={<CreateUser />} />
                          <Route path="/showusers" element={<ShowUsers />} />
                          <Route
                            path="/manageuser/:id"
                            element={<ManageUser />}
                            />

                            {/* ORGANIZATIONS */}

                          <Route path="/createorganization" element={<CreateOrganization />} />
                          <Route path="/showorganizations" element={<ShowOrganizations />} />
                          <Route
                            path="/manageorganization/:id"
                            element={<ManageOrganization/>}
                            />

                            {/* FEEDBACK MESSAGES */}
                          <Route
                            path="/mymessages"
                            element={<MyMessages isAdmin={false} />}
                          />
                          <Route
                            path="/adminmessages"
                            element={<MyMessages isAdmin={true} />}
                          />
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
    return { email: null, token: null, is_superuser: false, is_organizationadmin:false }
  }
}
