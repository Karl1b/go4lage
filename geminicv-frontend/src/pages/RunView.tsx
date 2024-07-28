import { useNavigate, useParams } from "react-router-dom";
import api from "../util/api";
import { useContext, useEffect, useState } from "react";
import { MainContext } from "../App";
import { Scan, Run } from "../util/types";
import Scancard from "../components/Scancard";
import LoadingSpinner from "../components/LoadingSpinner";
import ScanGraph from "../components/ScanGraph";
import Button from "../stylecomponents/Button";

export default function RunView() {
  const { userData } = useContext(MainContext);
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [showScanGraph, setShowScanGraph] = useState<boolean>(true);
  const [attempts, setAttempts] = useState<number>(0);
  const [showLoadingSpinner, SetShowLoadingSpinner] = useState<boolean>(false);
  const [run,setRun] = useState<Run | null>(null);

  const { id } = useParams();
  const cvrunid = id || null;

  async function getRun() {
    if (!cvrunid || attempts >= 20) {
      return;
    }
    const res = await api.getRun(userData.token, cvrunid);
    setScans(res.scans || null);
    setRun(res)

    setAttempts((prevAttempts) => prevAttempts + 1);
    const shouldShow = (res && res.scans.length < 5) || !res;

    SetShowLoadingSpinner(shouldShow);
  }

  useEffect(() => {
    getRun();
  }, []);

  useEffect(() => {
    const interValChecker = setInterval(() => {
      if (((scans && scans.length < 5) || !scans) && attempts < 45) {
        getRun();
      } else {
        SetShowLoadingSpinner(false);
      }
    }, 5000);
    return () => {
      clearInterval(interValChecker);
    };
  }, [userData, cvrunid, attempts]);

  return (
    <>
      <div className="w-full">
        {showLoadingSpinner ? (
          <>
            <LoadingSpinner />
          </>
        ) : (
          <></>
        )}
        <Button
          kind="primary"
          onClick={() => {
            navigate("/");
          }}
        >
          Back to Start
        </Button>
        <Button
          kind="secondary"
          onClick={() => {
            setShowScanGraph(!showScanGraph);
          }}
        >
          {showScanGraph ? "Hide graph" : "Show graph"}
        </Button>

        {showScanGraph && <ScanGraph scans={scans} />}

        {scans?.map((scan: Scan) => {
          return (
            <div key={scan.id} className="w-full">
              {run && 
              <Scancard scan={scan} run={run} />
              }
            </div>
          );
        })}
      </div>
    </>
  );
}
