import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Scan } from "../util/types";

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface ScanCardProps {
  scans: Scan[] | null;
}

const ScanGraph: React.FC<ScanCardProps> = ({ scans }) => {
  const labels = scans?.map(scan => `Scan ${scan.id}`);
  const annualGrossSalaryMinData = scans?.map(scan => scan.anual_gross_salary_min);
  const annualGrossSalaryAvgData = scans?.map(scan => scan.anual_gross_salary_avg);
  const annualGrossSalaryMaxData = scans?.map(scan => scan.anual_gross_salary_max);
  const hourlyFreelanceRateMinData = scans?.map(scan => scan.hourly_freelance_rate_min);
  const hourlyFreelanceRateAvgData = scans?.map(scan => scan.hourly_freelance_rate_avg);
  const hourlyFreelanceRateMaxData = scans?.map(scan => scan.hourly_freelance_rate_max);

  const data = {
    labels,
    datasets: [
      {
        label: 'Annual Gross Salary Min',
        data: annualGrossSalaryMinData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y-axis-1',
      },
      {
        label: 'Annual Gross Salary Avg',
        data: annualGrossSalaryAvgData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y-axis-1',
      },
      {
        label: 'Annual Gross Salary Max',
        data: annualGrossSalaryMaxData,
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        yAxisID: 'y-axis-1',
      },
      {
        label: 'Hourly Freelance Rate Min',
        data: hourlyFreelanceRateMinData,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
        yAxisID: 'y-axis-2',
        hidden: true,
      },
      {
        label: 'Hourly Freelance Rate Avg',
        data: hourlyFreelanceRateAvgData,
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        borderColor: 'rgba(255, 206, 86, 1)',
        borderWidth: 1,
        yAxisID: 'y-axis-2',
        hidden: true,
      },
      {
        label: 'Hourly Freelance Rate Max',
        data: hourlyFreelanceRateMaxData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        yAxisID: 'y-axis-2',
        hidden: true,
      }
    ],
  };

  const options:any = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Aggregated Salary and Freelance Rates for All Scans',
      },
    },
    scales: {
      'y-axis-1': {
        type: 'linear' as const,
        position: 'left' as const,
        ticks: {
          beginAtZero: true,
        },
        title: {
          display: true,
          text: 'Annual Gross Salary',
        },
      },
      'y-axis-2': {
        type: 'linear' as const,
        position: 'right' as const,
        ticks: {
          beginAtZero: true,
        },
        title: {
          display: true,
          text: 'Hourly Freelance Rate',
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-4">
      <Bar data={data} options={options} />
    </div>
  );
}

export default ScanGraph;
