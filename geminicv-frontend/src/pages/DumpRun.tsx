import { useParams } from "react-router-dom";
import api from "../util/api";
import { useContext, useEffect, useState } from "react";
import { MainContext } from "../App";
import { Scan } from "../util/types";
import DumpRunLoadScreen from "../components/DumpRunLoadScreen";
import DumpRunResultScreen from "../components/DumpRunResultScreen";

export default function DumpRun() {
  const { userData } = useContext(MainContext);
  const [scans, setScans] = useState<Scan[] | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [showLoadScreen, setShowLoadScreen] = useState<boolean>(false);

  const { id } = useParams();
  const cvrunid = id || null;

  async function getRun() {
    if (!cvrunid || attempts >= 20) {
      return;
    }
    const res = await api.getRun(userData.token, cvrunid);
    setScans(res || null);

    setAttempts((prevAttempts) => prevAttempts + 1);
    const shouldShow = (res && res.length < 5) || !res;

    setShowLoadScreen(shouldShow);
  }

  useEffect(() => {
    getRun();
  }, []);

  useEffect(() => {
    const interValChecker = setInterval(() => {
      if (((scans && scans.length < 5) || !scans) && attempts < 100) {
        getRun();
      } else {
        setShowLoadScreen(false);
      }
    }, 2000);
    return () => {
      clearInterval(interValChecker);
    };
  }, [userData, cvrunid, attempts]);

  return (
    <>
      {showLoadScreen ? (
        <DumpRunLoadScreen scans={scans} />
      ) : (
        <DumpRunResultScreen scans={scans} />
      )}
    </>
  );
}
