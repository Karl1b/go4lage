import { useParams } from "react-router-dom";
import api from "../util/api";
import { useContext, useEffect, useState } from "react";
import { MainContext } from "../App";
import { Run, Scan } from "../util/types";
import DumpRunLoadScreen from "../components/DumpRunLoadScreen";
import DumpRunResultScreen from "../components/DumpRunResultScreen";

export default function DumpRun() {
  const { userData } = useContext(MainContext);
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [showLoadScreen, setShowLoadScreen] = useState<boolean>(true);

  const [run, setRun] = useState<Run | null>(null);

  const { id } = useParams();
  const cvrunid = id || null;

  async function getRun() {
    if (!cvrunid) {
      return;
    }
    try {
      const res = await api.getRun(userData.token, cvrunid);
      setScans(res.scans || null);
      setRun(res || null);

      const shouldShow = (res.scans && res.scans.length < 5) || !res.scans;

      setShowLoadScreen(shouldShow);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    getRun();
  }, []);

  useEffect(() => {
    const interValChecker = setInterval(() => {
      if ((scans && scans.length < 5) || !scans) {
        getRun();
      }
    }, 2000);
    return () => {
      clearInterval(interValChecker);
    };
  }, [userData, cvrunid]);

  return (
    <>
      {showLoadScreen ? (
        <DumpRunLoadScreen scans={scans} />
      ) : (
        <>{run && <DumpRunResultScreen run={run} />}</>
      )}
    </>
  );
}
