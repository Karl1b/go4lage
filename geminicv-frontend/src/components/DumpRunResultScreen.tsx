import { useEffect, useState } from "react";
import { Run, Scan } from "../util/types";

import ImprovementIndicator from "./ImprovementIndicator";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../stylecomponents/Button";
import CompareScancard from "./CompareScancard";

export interface DumpRunResultScreenProps {
  run: Run;
}

export default function DumpRunResultScreen({ run }: DumpRunResultScreenProps) {
  const [startScan, setStartScan] = useState<Scan | null>(null);
  const [bestScan, setBestScan] = useState<Scan | null>(null);
  const [startIsBest, setStartIsBest] = useState<boolean>(false);
  const [improvement, setImprovement] = useState<number>(0);

  const { id } = useParams();
  const cvrunid = id || null;

  const navigate = useNavigate();

  function scanAvg(scan: Scan) {
    let value = (scan.anual_gross_salary_avg + scan.anual_gross_salary_min) / 2;

    if (!run?.permanent) {
      value =
        (scan.hourly_freelance_rate_avg + scan.hourly_freelance_rate_min) / 2;
    }

    return value;
  }

  useEffect(() => {
    if (run.scans && run.scans.length > 0) {
      // Set startScan from scan array where start_version is true
      const start = run.scans.find((scan) => scan.start_version) || null;
      setStartScan(start);

      // Set bestScan from scan array based on the highest scanAvg
      const best = run.scans.reduce((bestSoFar, currentScan) => {
        return scanAvg(currentScan) > scanAvg(bestSoFar)
          ? currentScan
          : bestSoFar;
      }, run.scans[0]);
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
  }, [run.scans]);

  return (
    <>
      {startScan && (
        <div>
          <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md m-5">
            <div className="flex items-center justify-between m-4">
              <ImprovementIndicator
                startisbest={startIsBest}
                improvement={improvement}
                run={run}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center">
        <Button kind="secondary" onClick={() => navigate(`/run/${cvrunid}`)}>
          See detailed Results
        </Button>
      </div>

      {startScan && bestScan && run && (
        <CompareScancard startScan={startScan} bestScan={bestScan} run={run} />
      )}
    </>
  );
}
