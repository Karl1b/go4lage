import logo from "../assets/logo.svg";

export default function Logo({ size }: { size: string }) {
  return (
    <>
      <div className="bg-transparent m-2">
        <img src={logo} width={size} />
      </div>
    </>
  );
}
