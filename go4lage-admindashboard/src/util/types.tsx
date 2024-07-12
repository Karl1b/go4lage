export interface UserDetails {
  email: string | null
  token: string | null
}

export interface DataSeries {
  name: string
  data: number[]
}

export interface DashboardInfo {
  tfa: boolean
}

export interface User {
  id: string
  created_at: number
  email: string
  first_name: string
  last_name: string
  username: string
  is_active: boolean
  is_superuser: boolean
  last_login: number
  groups: string
  permissions: string
}

export interface NewUser {
  password: string
  groups: string
  permissions: string
  email: string
  first_name: string
  last_name: string
  username: string
  is_active: boolean
  is_superuser: boolean
}

export interface Group {
  id: string
  name: string
  checked: boolean
}

export interface Permission {
  id: string
  name: string
  checked: boolean
}

export interface ToastDetails {
  show: boolean
  success: boolean
  header: string
  text: string
}

export interface Backup {
  file_name: string
}

export interface Log {
  log_date: string
  total_count: number
}

export interface LogRatio {
  log_date: string
  index_count: number
  imprint_count: number
}

export interface LogDetail {
  timestamp: string
  client_ip: string
  request_method: string
  request_uri: string
  request_protocol: string
  status_code: number
  response_duration: number
  user_agent: string
  referrer: string
}
