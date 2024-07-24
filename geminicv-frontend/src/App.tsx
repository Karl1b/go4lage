import { createContext, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastDetails, UserDetails } from "./util/types";
import Toast from "./components/Toast";
import Header from "./components/Header";
import Index from "./pages/Index";
import Run from "./pages/Run";
import Login from "./pages/Login";
import About from "./pages/About";
import DumpRun from "./pages/DumpRun";

interface IMainContext {
  toast: ToastDetails;
  setToast: (value: ToastDetails) => void;
  userData: UserDetails;
  setUserData: (value: UserDetails) => void;
}

export const MainContext = createContext<IMainContext>({
  userData: { email: null, token: null },
  toast: { show: false, success: true, text: "", header: "" },
  setUserData: () => {},
  setToast: () => {},
});

function App() {
  const [userData, setUserData] = useState<UserDetails>(
    getUserDataFromSession()
  );
  const [toast, setToast] = useState<ToastDetails>({
    show: false,
    success: true,
    header: "",
    text: "",
  });

  return (
    <>
      <BrowserRouter>
        <MainContext.Provider
          value={{
            userData,
            setUserData,
            toast,
            setToast,
          }}
        >
          <div className="bg-secondary min-h-screen">
            <Toast />
            {userData.email ? (
              <>
                <Header />
                <div className="flex justify-center">
                  <div className="w-full lg:w-10/12  bg-section min-h-screen shadow-2xl">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/dumprun/:id" element={<DumpRun />} />
                      <Route path="/run/:id" element={<Run />} />
                    </Routes>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Login />
              </>
            )}
          </div>
        </MainContext.Provider>
      </BrowserRouter>
    </>
  );
}

export default App;

function getUserDataFromSession() {
  const storedUserData = sessionStorage.getItem("userData");
  if (storedUserData) {
    return JSON.parse(storedUserData);
  } else {
    return { username: null, email: null };
  }
}
