import { useContext, useEffect, useRef, useState } from "react";
import { MainContext } from "../App";
import Button from "../stylecomponents/Button";
import api from "../util/api";
import { Run } from "../util/types";
import RunCard from "../components/Runcard";
import { useNavigate } from "react-router-dom";
import ToggleSwitch from "../components/ToggleSwitch"; // Import the ToggleSwitch component

export default function Index() {
  const formRef = useRef<HTMLFormElement>(null);
  const { userData, setToast } = useContext(MainContext);

  const [runs, setRuns] = useState<Run[] | null>(null);
  const [runMode, setRunmode] = useState<string>("pdf");
  const [textValue, setTextValue] = useState<string>("");
  const [showUpload, setShowUpload] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function getRuns() {
      try {
        const res = await api.getRuns(userData.token);
        setRuns(res.runs || null);
        setShowUpload((res.current_runs || 0) < (res.max_runs || 0));
      } catch (error) {
        console.error("Error fetching runs", error);
      }
    }
    getRuns();
  }, [userData]);

  async function handleCVupload(event: React.FormEvent) {
    event.preventDefault();
    if (formRef.current && userData.token) {
      const formData = new FormData(formRef.current);
      try {
        const res = await api.uploadcv(userData.token, formData, setToast);
        setRuns(res.runs || null);
        setShowUpload((res.current_runs || 0) < (res.max_runs || 0));
      } catch (error) {
        console.error("Error uploading CV", error);
      }
    }
  }

  async function sendText() {
    try {
      const res = await api.uploadText(userData.token, textValue, setToast);
      setRuns(res.runs || null);
      setShowUpload((res.current_runs || 0) < (res.max_runs || 0));
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Gemini CV Helper</h1>
      <p className="text-center text-lg mb-4 ">
        What is this{" "}
        <Button
          kind="primary"
          onClick={() => {
            navigate("/about");
          }}
        >
          {" "}
          About
        </Button>{" "}
        ?{" "}
      </p>

      {runs ? (
        <>
          <p className="text-lg mb-6 text-center">
            Here are your past Gemini CV help runs:
          </p>
        </>
      ) : (
        <>
          <p className="text-lg mb-4">
            Upload your current CV or even an unformatted CV draft. You can use
            a PDF or copy and paste directly from your writer app. Gemini CV
            helper will improve your CV, recommend a next career step, and also
            rate your market value.
          </p>
          <p className="text-lg mb-4">
            By choosing the fitting version of your CV, you have the potential
            to raise the starting point for your salary negotiations. Our tests
            show that an increase of $5k to $10k per year is realistic.
          </p>
          <p className="text-lg mb-6">
            If you upload a CV in English, the market value is rated against the
            US job market. If you provide your CV in German, the values are for
            the German job market.
          </p>
        </>
      )}
      <div className="w-full mb-6">
        {runs?.map((run: Run) => {
          return (
            <div key={run.id} className="w-full mb-4">
              <RunCard run={run} />
            </div>
          );
        })}
      </div>

      {showUpload && (
        <div>
          <div className="flex justify-center mb-4">
            <p className="text-lg">
              Switch mode: Upload a PDF or simply copy and paste plain text from
              your writer app.
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <p>PDF</p>
            <ToggleSwitch
              isChecked={runMode === "txt"}
              onChange={() => setRunmode(runMode === "pdf" ? "txt" : "pdf")}
            />
            <p>TXT</p>
          </div>

          {runMode === "pdf" ? (
            <div className="flex justify-center">
              <form
                id="bulk_createForm"
                ref={formRef}
                className="w-full max-w-lg"
                onSubmit={handleCVupload}
              >
                <div className="mb-4">
                  <label htmlFor="upload" className="block text-gray-700">
                    Upload CV PDF
                  </label>
                  <input
                    type="file"
                    id="upload"
                    name="upload"
                    required
                    className="mt-2 block w-full border rounded-lg p-2"
                  />
                </div>
                <Button kind="primary">
                  <button type="submit">Upload CV</button>
                </Button>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex justify-center mb-4">
                <p className="text-lg">
                  Simply copy and paste from your writer app. There is no need
                  to format the text nicely, but it should be some sort of CV
                  draft. Simply bulk all info in. If you used skills like
                  "Excel" in several positions, mention them every time. Even if
                  it seems logical to a human that you used office software in
                  this position. Also mention your biggest achviements. This
                  could be something like "Increased sales volume by 20%".
                </p>
              </div>
              <textarea
                className="w-full border rounded-lg p-4 mb-4"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                style={{ whiteSpace: "pre-wrap", minHeight: "50vh" }}
              />
              <div className="flex flex-row justify-end">
                <Button
                  kind="primary"
                  onClick={() => {
                    sendText();
                  }}
                >
                  Use as new starting point
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
