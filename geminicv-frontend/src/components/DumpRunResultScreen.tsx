import { useEffect, useState } from "react";
import { Scan } from "../util/types";
import Scancard from "./Scancard";
import ToggleSwitch from "./ToggleSwitch";
import ImprovementIndicator from "./ImprovementIndicator";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../stylecomponents/Button";

export interface DumpRunResultScreenProps {
  scans: Scan[] | null;
}

export default function DumpRunResultScreen({
  scans,
}: DumpRunResultScreenProps) {
  const [startScan, setStartScan] = useState<Scan | null>(null);
  const [bestScan, setBestScan] = useState<Scan | null>(null);
  const [startIsBest, setStartIsBest] = useState<boolean>(false);
  const [improvement, setImprovement] = useState<number>(0);
  const [showMode, setShowmode] = useState<string>("best");

  const { id } = useParams();
  const cvrunid = id || null;

  const navigate = useNavigate();

  function scanAvg(scan: Scan) {
    const value =
      (scan.anual_gross_salary_avg +
        scan.anual_gross_salary_max +
        scan.anual_gross_salary_min) /
      3;
    return value;
  }

  useEffect(() => {
    if (scans && scans.length > 0) {
      // Set startScan from scan array where start_version is true
      const start = scans.find((scan) => scan.start_version) || null;
      setStartScan(start);

      // Set bestScan from scan array based on the highest scanAvg
      const best = scans.reduce((bestSoFar, currentScan) => {
        return scanAvg(currentScan) > scanAvg(bestSoFar)
          ? currentScan
          : bestSoFar;
      }, scans[0]);
      setBestScan(best);

      // Set Improvement to the scanAvg of the best * 100 / scanAvg of the start
      if (start) {
        const improvementValue = scanAvg(best) - scanAvg(start);
        setImprovement(improvementValue);
      }

      // Set startIsBest if start and best scan have the same ID
      if (start && best && start.id === best.id) {
        setStartIsBest(true);
      } else {
        setStartIsBest(false);
      }
    }
  }, [scans]);

  return (
    <>
      {startScan && (
        <div>
          <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md m-5">
            <div className="flex items-center justify-between m-4">
              <ImprovementIndicator
                startisbest={startIsBest}
                improvement={improvement}
                language={startScan.language}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="flex  justify-center m-5 mb-6 p-6 max-w-md bg-white rounded-xl shadow-md">
          <p>Gemini's best rated CV</p>
          <ToggleSwitch
            isChecked={showMode === "start"}
            onChange={() => setShowmode(showMode === "best" ? "start" : "best")}
          />
          <p>your uploaded CV</p>
        </div>
        <div className="flex items-center">

        <Button kind="secondary" onClick={() => navigate(`/run/${cvrunid}`)}>
          See detailed Results
        </Button>
        </div>
      </div>

      {showMode == "best" ? (
        <>
          {bestScan && (
            <div>
              <Scancard scan={bestScan} />
            </div>
          )}
        </>
      ) : (
        <>
          {startScan && (
            <div>
              <Scancard scan={startScan} />
            </div>
          )}
        </>
      )}
    </>
  );
}
