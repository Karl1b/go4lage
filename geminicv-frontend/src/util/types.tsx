
  export interface UserDetails {
    email: string | null
    token: string | null
  }
  
  export interface ToastDetails {
    show: boolean
    success: boolean
    header: string
    text: string
  }
  
  export interface Run {
    id:string
    timestamp: string
  }

  export interface Scan {
    id:string
    text:string
    start_version:boolean
    anual_gross_salary_min:number
    anual_gross_salary_avg:number
    anual_gross_salary_max:number
    hourly_freelance_rate_min:number
    hourly_freelance_rate_avg:number
    hourly_freelance_rate_max:number
    next_career_step:string
  }

  export interface RunInfo{
    runs: Run[]
    max_runs: number
    current_runs:number

  }