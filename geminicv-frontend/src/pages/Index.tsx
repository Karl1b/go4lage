import { useContext, useEffect, useRef, useState } from "react";
import { MainContext } from "../App";
import Button from "../stylecomponents/Button";
import api from "../util/api";
import { Run } from "../util/types";
import RunCard from "../components/Runcard";
import { useNavigate } from "react-router-dom";
import ToggleSwitch from "../components/ToggleSwitch"; // Import the ToggleSwitch component
import { goToNewRun } from "../util/util";

export default function Index() {
  const formRef = useRef<HTMLFormElement>(null);
  const { userData, setToast } = useContext(MainContext);

  const [runs, setRuns] = useState<Run[] | null>(null);

  const [runMode, setRunmode] = useState<string>("pdf");
  const [region, setRegion] = useState<string>("en");
  const [permanent, setPermanent] = useState<boolean>(true);

  const [textValue, setTextValue] = useState<string>("");
  const [showUpload, setShowUpload] = useState<boolean>(true);

  const [showInstruction, setShowInstruction] = useState<boolean>(false);

  const [initialLoad, setInitialLoad] = useState<boolean>(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function getRuns() {
      try {
        const res = await api.getRuns(userData.token);
        setRuns(res?.runs || null);
        setShowUpload((res?.current_runs || 0) < (res?.max_runs || 0));
      } catch (error) {
        console.error("Error fetching runs", error);
      } finally {
        setInitialLoad(false);
      }
    }
    getRuns();
  }, [userData]);

  async function handleCVupload(event: React.FormEvent) {
    event.preventDefault();
    if (formRef.current && userData.token) {
      const formData = new FormData(formRef.current);
      try {
        const res = await api.uploadcv(
          userData.token,
          formData,
          region,
          permanent,
          setToast
        );
        setRuns(res?.runs || null);
        setShowUpload((res?.current_runs || 0) < (res?.max_runs || 0));
        if (res) {
          goToNewRun(res, navigate);
        }
      } catch (error) {
        console.error("Error uploading CV", error);
      }
    }
  }

  async function sendText() {
    try {
      const res = await api.uploadText(
        userData.token,
        textValue,
        region,
        permanent,
        setToast
      );
      setRuns(res?.runs || null);
      setShowUpload((res?.current_runs || 0) < (res?.max_runs || 0));

      if (res) {
        goToNewRun(res, navigate);
      }
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 shadow-lg rounded-lg min-h-screen">
      {initialLoad ? (
        <></>
      ) : (
        <>
          {runs ? (
            <>
              <p className="text-lg mb-6 text-center">
                Here are your past Gemini CV help runs. Click on them to see the
                results.
              </p>
            </>
          ) : (
            <>
              <Anleitung />
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
          {showInstruction && <Anleitung />}
          {runs && (
            <div className="flex justify-center mb-5">
              <Button
                kind="primary"
                onClick={() => {
                  setShowInstruction(!showInstruction);
                }}
              >
                {!showInstruction ? "show instruction" : "hide instruction"}
              </Button>
            </div>
          )}

          {showUpload && (
            <div>
              <div className="flex justify-center mb-4">
                <p className="text-lg">Choose your target region.</p>
              </div>

              <div className="flex justify-center mb-5">
                <p>US</p>
                <ToggleSwitch
                  isChecked={region === "de"}
                  onChange={() => setRegion(region === "de" ? "en" : "de")}
                />
                <p>GER</p>
              </div>
              <div className="flex justify-center mb-4">
                <p className="text-lg">
                  Are you freelancing or looking for a permanent position?
                </p>
              </div>

              <div className="flex justify-center mb-5">
                <p>Freelancer</p>
                <ToggleSwitch
                  isChecked={permanent}
                  onChange={() => setPermanent(!permanent)}
                />
                <p>Permanent position</p>
              </div>

              <div className="flex justify-center mb-4">
                <p className="text-lg">
                  Upload a PDF or simply copy and paste plain text from your
                  writer app.
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
                    <Button kind="primary" type="submit">
                      Upload CV
                    </Button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-4">
                    <p className="text-lg">
                      Simply copy and paste from your writer app. There is no
                      need to format the text nicely, but it should be some sort
                      of CV draft. Simply bulk all info in. If you used skills
                      like "Excel" in several positions, mention them every
                      time. Even if it seems logical to a human that you used
                      office software in this position. Also mention your
                      biggest achviements. This could be something like
                      "Increased sales volume by 20%".
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
          {!showUpload && (
            <div>
              You have reached your run limit. Contact the developer if you need
              more.
            </div>
          )}

          <p className="text-end text-lg mb-4 ">
            What is this{" "}
            <Button
              kind="secondary"
              onClick={() => {
                navigate("/about");
              }}
            >
              {" "}
              About
            </Button>{" "}
            ?{" "}
          </p>
        </>
      )}
    </div>
  );
}
function Anleitung() {
  return (
    <>
      <p className="text-lg mb-4">
        <b>1. Choose your target region:</b> You have the option to select
        either the US or German market.
      </p>
      <p className="text-lg mb-4">
        <b>2. Choose mode:</b> Indicate whether you are seeking freelance gigs
        with hourly payment or a permanent position.
      </p>

      <p className="text-lg mb-4">
        <b>3. Upload your current CV:</b> You can do this via file upload or by
        copying and pasting plain text. The Gemini CV helper will enhance your
        CV, recommend your next career step, and evaluate your market value.
      </p>
      <p className="text-lg mb-4">
        <b>4. Use your optimized CV for your job application:</b> You have the
        potential to increase the starting point for your salary negotiations.
        Our tests show that an increase of $5k to $10k per year is realistic.
      </p>
      <p className="text-lg mb-6">
        <b>Tips:</b> Provide as much information as possible. Mention all skills
        used in previous positions and your biggest achievements, especially
        those with a financial impact on the company. Keep your CV simple with
        text and pictures only, especially if you plan to convert it to a PDF.
        Some parsers may have issues with complex formats. Avoid LaTeX and fancy
        Microsoft Word features. Plain LibreOffice or OpenOffice works well.
      </p>
    </>
  );
}
