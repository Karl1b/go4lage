import logo from "../assets/logo.svg";

export default function Logo() {
  return (
    <>
      <a href="/">
        <div className="m-0 mt-[-16px] md:mt-[-26px] bg-transparent">
          <img src={logo} width="100px" />
        </div>
      </a>
    </>
  );
}
