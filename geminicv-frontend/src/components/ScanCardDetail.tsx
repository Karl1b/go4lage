import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Scan } from "../util/types";
import Button from "../stylecomponents/Button";
import { useState } from "react";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface ScanCardProps {
  scan: Scan;
}

export default function ScanCardDetail({ scan }: ScanCardProps) {
  const [showHint, setShowHint] = useState<boolean>(false);

  const data = {
    labels: ["Min", "Avg"],
    datasets: [
      {
        label: "Annual Gross Salary",
        data: [
          scan.anual_gross_salary_min,
          scan.anual_gross_salary_avg,
        
        ],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "y-axis-1",
      },
      {
        label: "Hourly Freelance Rate",
        data: [
          scan.hourly_freelance_rate_min,
          scan.hourly_freelance_rate_avg,
          
        ],
        backgroundColor: "rgba(153, 102, 255, 0.6)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
        yAxisID: "y-axis-2",
        hidden: true,
      },
    ],
  };

  const options: any = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Salary and Freelance Rates",
      },
    },
    scales: {
      "y-axis-1": {
        type: "linear" as const,
        position: "left" as const,
        ticks: {
          beginAtZero: true,
        },
        title: {
          display: true,
          text: "Annual Gross Salary",
        },
      },
      "y-axis-2": {
        type: "linear" as const,
        position: "right" as const,
        ticks: {
          beginAtZero: true,
        },
        title: {
          display: true,
          text: "Hourly Freelance Rate",
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-lg">
      <div className="">
        <Bar data={data} options={options} />
      </div>
      <div className="flex">
        <div className="flex">
          <div className="flex flex-col">
            <div className="text-center font-semibold">
              Annual Gross Salary:
            </div>

            <div className="flex justify-center">
              <p className="m-5">Min: {scan.anual_gross_salary_min}</p>
              <p className="m-5">Avg: {scan.anual_gross_salary_avg}</p>
              
            </div>
            <div className="text-center font-semibold">
              Hourly Freelance Rate:
            </div>
            <div className="flex justify-center">
              <p className="m-5">Min: {scan.hourly_freelance_rate_min}</p>
              <p className="m-5">Avg: {scan.hourly_freelance_rate_avg}</p>
            
            </div>
            <div className="text-center m-4">
              <Button
                kind="secondary"
                className="rounded-full"
                onClick={() => setShowHint(!showHint)}
              >
                <div className="h-7 w-7">?</div>
              </Button>
            </div>

            <div
              className={`transition-all duration-300 ease-in-out ${
                showHint ? "visible h-auto" : "invisible h-0 overflow-hidden"
              }`}
            >
              <div className="font-light text-center m-5">
                Values are in USD for the American market or EUR for the German
                market, depending on the CV target.
              </div>

              <div className="font-light text-center m-5">
                These values are the answers to the questions that the recruiter
                might ask their LLM about the candidate based on its CV. For
                example: "What's the minimal salary that the candidate might
                accept?"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
