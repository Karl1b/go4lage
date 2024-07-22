import Logout from "./Logout";
import Logo from "./Logo";
export default function Header() {
  return (
    <header className="sticky-top-0 bg-primary flex justify-center text-slate-100">
      <div className=" bg-pink">
        <div className="flex justify-around items-center w-screen">
          <Logo />
          <div className="text-4xl text-whitesmoke">Gemini CV</div>
          <div className="font-semibold"></div>
          <Logout />
        </div>
      </div>
    </header>
  );
}
