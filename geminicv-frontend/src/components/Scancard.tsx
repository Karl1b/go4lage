import { Run, Scan } from "../util/types";
import { useContext, useState } from "react";
import Button from "../stylecomponents/Button";
import api from "../util/api";
import { MainContext } from "../App";
import ScanCardDetail from "./ScanCardDetail";

export interface ScanCardProps {
  scan: Scan;
  run: Run;
}

export default function Scancard({ scan,run }: ScanCardProps) {
  const [showText, setShowText] = useState<boolean>(false);
 const [textValue, setTextValue] = useState<string>(scan.text);
  const { userData, setToast } = useContext(MainContext);

  async function copyToClipBoard() {
    try {
      await navigator.clipboard.writeText(textValue);
      alert("Text copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  async function sendText() {
    try {
      
      await api.uploadText(userData.token, textValue,run.language,run.permanent, setToast);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-4">
      <div className="flex flex-col space-y-4">
        {scan.start_version && (
          <p className="text-center text-lg font-semibold">
            This was the starting point of the run
          </p>
        )}

        <ScanCardDetail scan={scan} />

  
        <div className="flex justify-center space-x-4">

          <Button
            kind="primary"
            onClick={() => setShowText(!showText)}
          >
            {showText ? "Hide" : "Show"} CV
          </Button>
        </div>

        {showText && (
          <div className="flex flex-col space-y-4">
            <p className="text-lg">
              Edit the text and send it to the backend as a new run for fine
              tuning. Tips: Name every skill you used in a position and your
              biggest success in a position as well.
            </p>
            <textarea
              className="w-full border rounded-lg p-4"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              style={{ whiteSpace: "pre-wrap", minHeight: "50vh" }}
            />
            <div className="flex flex-row justify-end space-x-4">
              <Button
                kind="secondary"
                onClick={copyToClipBoard}
              >
                Copy to Clipboard
              </Button>
              <Button
                kind="primary"
                onClick={sendText}
              >
                Use as new start point
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
