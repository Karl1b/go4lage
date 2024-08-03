import { useNavigate } from "react-router-dom";
import { Run } from "../util/types";
import { format } from "date-fns";

export interface RunCardProps {
  run: Run;
}

export default function RunCard({ run }: RunCardProps) {
  const navigate = useNavigate();

  const formattedTimeStamp = format(
    new Date(run.timestamp),
    "dd.MM.yyyy HH:mm"
  );

  return (
    <div className="flex justify-center cursor-pointer">
      <div
        className="bg-gray-300 p-2 rounded-lg border shadow-lg hover:bg-bright transition-colors w-full flex justify-center"
        onClick={() => navigate(`/dumprun/${run.id}`)}
      >
        <p className="mr-2">Click to see your optimized run from: </p><p className="font-bold">{formattedTimeStamp}</p>
      </div>
    </div>
  );
}
