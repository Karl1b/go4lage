import { useEffect, useState } from "react";
import { Scan } from "../util/types";
import Loader from "./Loader";

export interface DumpRunLoadScreenProps {
  scans: Scan[] | null;
}

export type LoadingState = "idle" | "loading" | "finished";

export default function DumpRunLoadScreen({ scans }: DumpRunLoadScreenProps) {
  const [regionChooserLoad, setRegionChooserLoad] = useState<
    "idle" | "loading" | "finished"
  >("loading");

  const [ratingImprovements, setRatingImprovements] = useState<LoadingState[]>([
    "idle",
    "idle",
    "idle",
    "idle",
    "idle",
  ]);

  useEffect(() => {
    if (scans && scans.length > 0) {
      setRegionChooserLoad("finished");

      if (ratingImprovements[0] === "idle") {
        setRatingImprovements([
          "loading",
          "loading",
          "loading",
          "loading",
          "loading",
        ]);
      }
      setRatingImprovements((prev) =>
        prev.map((imp, index) => {
          if (index < scans.length) {
            return "finished";
          }
          return imp;
        })
      );
    }
  }, [scans]);

  return (
    <div>
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md">
        <p className="font-semibold text-lg">
          Gemini CV is analysing and improving your CV:
        </p>

        <div className="flex">
          <Loader status={regionChooserLoad} />{" "}
          <p className="m-5">Choosing region</p>
        </div>
        <div>
          {ratingImprovements.map((imp, index) => (
            <div key={index} className="flex">
              <Loader status={imp} />

              <p className="m-5"> Rating version {index + 1}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
