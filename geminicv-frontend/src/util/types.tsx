export interface UserDetails {
  email: string | null;
  token: string | null;
}

export interface ToastDetails {
  show: boolean;
  success: boolean;
  header: string;
  text: string;
}

export interface Run {
  scans: Scan[];
  id: string;
  timestamp: string;
  language: string;
  permanent:boolean;
}

export interface Scan {
  id: string;
  text: string;
  start_version: boolean;
  anual_gross_salary_min: number;
  anual_gross_salary_avg: number;
  hourly_freelance_rate_min: number;
  hourly_freelance_rate_avg: number;
}

export interface RunInfo {
  runs: Run[];
  max_runs: number;
  current_runs: number;
}


export type LoadingState = "idle" | "loading" | "finished";