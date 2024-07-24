import Logo from "./Logo";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center m-5">
      <div className="animate-spin h-16 w-16  rounded-full">
        <Logo size="100px" />
      </div>
    </div>
  );
}
