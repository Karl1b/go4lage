import Logout from "./Logout";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky-top-0 bg-primary flex justify-center text-slate-100">
      <div className=" bg-custom-gradient">
        <div className="flex justify-center items-center w-screen">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => {
              navigate("/");
            }}
          >
            <Logo size="100px" />
            <h1>Gemini CV</h1>
          </div>
          <Logout />
        </div>
      </div>
    </header>
  );
}
