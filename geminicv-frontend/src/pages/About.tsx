import { useNavigate } from "react-router-dom";
import Button from "../stylecomponents/Button";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">About Recruitment Evolution</h1>

      <section className="mb-6">
        <p className="mb-4">
          Recruitment has changed over time. In the past, recruiters manually reviewed CVs and contacted the best candidates.
        </p>
        <p className="mb-4">
          Later, candidates had to enter their information into company databases. This helped recruiters but was time-consuming for applicants.
        </p>
        <p>
          Next, automatic text parsers were used to extract skills from CVs. These tools are helpful but not perfect. It's still important to clearly list your skills in your CV.
        </p>
      </section>

      <section className="mb-6">
        <p className="mb-4">
          Today, many recruiters use AI language models to analyze and rank CVs. They then select the top candidates to contact.
        </p>
        <p className="mb-4">
          <strong>This means: Recruiters often first look at your CV when they contact you.</strong>
        </p>
        <p>
          Your CV has done its job if you get contacted. Focus on a simple, clear layout rather than complex designs.
        </p>
      </section>

      <section className="mt-6">
        <p className="mb-4">
          Gemini CV Helper optimizes your CV for AI systems, not human readers.
        </p>
        <p>
          Just use a simple layout and include a professional photo of yourself.
        </p>
      </section>
      <Button
        kind="primary"
        onClick={() => navigate("/")}
        className="m-4"
      >
        Back to start
      </Button>
    </div>
  );
}