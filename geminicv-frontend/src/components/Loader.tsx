import { LoadingState } from "./DumpRunLoadScreen";

interface LoaderProps {
  status: LoadingState;
}

export default function Loader({ status }: LoaderProps) {
  return (
    <div className="flex items-center justify-center w-32 h-10 rounded-full bg-gray-200 m-5 overflow-hidden relative">
      <div
        className={`
            absolute inset-0 transition-all duration-300 ease-in-out
            ${status === "idle" ? "w-0 bg-gray-400" : ""}
            ${status === "loading" ? "w-2/3 bg-pink" : ""}
            ${status === "finished" ? "w-full bg-bright" : ""}
          `}
      />
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {status === "idle" && (
          <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse" />
        )}
        {status === "loading" && (
          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white rounded-full animate-pulse"
              />
            ))}
          </div>
        )}
        {status === "finished" && (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
    </div>
  );
}
