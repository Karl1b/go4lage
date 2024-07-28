import { Run } from "../util/types";

export interface ImprovementIndicatorProps {
  startisbest: boolean;
  improvement: number;
  run: Run;
}

export default function DumpRunLoadScreen({
  startisbest,
  improvement,
  run,
}: ImprovementIndicatorProps) {
  const isPositive = improvement > 0;
  const isGerman = run.language === "de";
  const isPermanent = run.permanent

  const formattedImprovement = new Intl.NumberFormat(
    isGerman ? "de-DE" : "en-US",
    {
      style: "currency",
      currency: isGerman ? "EUR" : "USD",
      maximumFractionDigits: 0,
    }
  ).format(Math.abs(improvement));

  const texts = {
    title: isGerman ? "Gehaltsauswirkung" : "Salary Impact",
    estimated: isGerman ? "Geschätzte" : "Estimated",
    increase: isGerman ? "Erhöhung" : "increase",
    decrease: isGerman ? "Verringerung" : "decrease",
    annualSalary: isGerman ? isPermanent? "des Brutto Jahresgehalts" : "des Stundensatzes" : isPermanent? "in annual salary" : "in hourly rate",
    bestVersion: isGerman
      ? "Die ursprüngliche Version des Lebenslaufs bietet bereits ein gutes Gehaltspotenzial."
      : "The initial resume version yields a good potential salary.",
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">{texts.title}</h2>
      <span
        className={`text-2xl ${isPositive ? "text-high" : "text-red-500"}`}
      >
        {isPositive ? "▲" : "▼"}
      </span>

      <div className="text-center">
        <div
          className={`text-4xl font-bold ${
            isPositive ? "text-high" : "text-red-600"
          }`}
        >
          {formattedImprovement}
        </div>
        <p className="mt-2 text-gray-600">
          {texts.estimated} {isPositive ? texts.increase : texts.decrease}{" "}
          {texts.annualSalary}
        </p>
      </div>
      {startisbest && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-700 font-medium text-center">
            {texts.bestVersion}
          </p>
        </div>
      )}
    </div>
  );
}
