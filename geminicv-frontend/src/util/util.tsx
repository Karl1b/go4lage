

import { RunInfo } from "./types";

export function goToNewRun(runInfo: RunInfo, navigate: (path: string) => void) {
  if (runInfo.runs.length === 0) {
    console.error("No runs available to navigate to.");
    return;
  }
  // Select the newest Run from Run
  const newestRun = runInfo.runs.reduce((latest, current) => {
    return new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest;
  });
  navigate(`/dumprun/${newestRun.id}`);
}
