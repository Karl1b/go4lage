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
        className="bg-gray-300 p-1 rounded-lg border shadow-lg hover:bg-gray-100 transition-colors w-full"
        onClick={() => navigate(`/run/${run.id}`)}
      >
        <p>{formattedTimeStamp}</p>
      </div>
    </div>
  );
}
