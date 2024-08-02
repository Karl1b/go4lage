

import logo from '../assets/go4lage-logo-plain.svg'
import goopher from '../assets/goopher.svg'

export default function Index() {
    //const { userData } = useContext(MainContext);
return (
    <>


    <div className='flex justify-center mt-5'>

    <div className="m-0 ">
          <img src={logo} width="150px" />
        </div>
        <div className="m-0 ">
          <img src={goopher} width="150px" />
        </div>
    </div>
    <h1 className='text-center'>Welcome home, admin</h1>
    
    </>
  )}