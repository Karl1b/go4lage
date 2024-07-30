import { Run, Scan } from "../util/types";
import { useContext, useState } from "react";
import Button from "../stylecomponents/Button";
import api from "../util/api";
import { MainContext } from "../App";

import ToggleSwitch from "./ToggleSwitch";
import ComppareScanCardDetail from "./CompareScancardDetail";
import { goToNewRun } from "../util/util";
import { useNavigate } from "react-router-dom";

export interface CompareScanCardProps {
  bestScan: Scan;
  startScan: Scan;
  run: Run;
}

export default function CompareScancard({
  startScan,
  run,
  bestScan,
}: CompareScanCardProps) {
  const [showText, setShowText] = useState<boolean>(false);

  const [bestText, setBestText] = useState<string>(bestScan.text);
  const [startText, setStartText] = useState<string>(startScan.text);
  const { userData, setToast } = useContext(MainContext);

  const [toggleIsBest, SettoggleIsBest] = useState<boolean>(true);

  const navigate = useNavigate();

  async function copyToClipBoard() {
    try {
      const textValue = toggleIsBest ? bestText : startText;
      await navigator.clipboard.writeText(textValue);
      alert("Text copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  async function sendText() {
    try {
      const textValue = toggleIsBest ? bestText : startText;
      const res = await api.uploadText(
        userData.token,
        textValue,
        run.language,
        run.permanent,
        setToast
      );
      if (res) {
        goToNewRun(res, navigate);
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-4">
      <div className="flex flex-col space-y-4">
        <ComppareScanCardDetail
          startScan={startScan}
          bestScan={bestScan}
          run={run}
        />

        <div className="flex justify-center space-x-4">
          <Button kind="primary" onClick={() => setShowText(!showText)}>
            {showText ? "Hide" : "Show"} CV
          </Button>
        </div>

        {showText && (
          <div className="flex flex-col space-y-4">
            <div className="flex  justify-center m-5 mb-6 p-6 max-w-md bg-white rounded-xl shadow-md">
              <p>your uploaded CV</p>
              <ToggleSwitch
                isChecked={toggleIsBest}
                onChange={() => SettoggleIsBest(!toggleIsBest)}
              />
              <p>Gemini's best rated CV</p>
            </div>
            <p className="text-lg">
              Edit the text and send it to the backend as a new run for fine
              tuning. Tips: Name every skill you used in a position and your
              biggest success in a position as well.
            </p>
            <textarea
              className="w-full border rounded-lg p-4"
              value={toggleIsBest ? bestText : startText}
              onChange={(e) => {
                toggleIsBest
                  ? setBestText(e.target.value)
                  : setStartText(e.target.value);
              }}
              style={{ whiteSpace: "pre-wrap", minHeight: "50vh" }}
            />
            <div className="flex flex-row justify-end space-x-4">
              <Button kind="secondary" onClick={copyToClipBoard}>
                Copy to Clipboard
              </Button>
              <Button kind="primary" onClick={sendText}>
                Use as new start point
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
