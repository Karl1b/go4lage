export interface UserDetails {
  email: string | null
  token: string | null
  is_superuser :boolean,
  is_organizationadmin: boolean,
  organization_name? : string | null,
  organization_id? : string | null,  
}

export interface DataSeries {
  name: string
  data: number[]
}

export interface DashboardInfo {
  tfa: boolean
}

export interface OrganizationResponse {
  id: string
  created_at: number
  organization_name: string
  email: string
  active_until: number
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
  organization?: OrganizationResponse
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
  organization_id: string | null
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

export interface FeedBackT {
  id: string
  behaviour_is: string
  behaviour_should: string
  full_url: string
  chat: string | null
  is_solved: boolean
  created_at: string
  updated_at: string
}

export interface FeedbackMsgT {
  message: string
  id: string
  is_solved: boolean | null
}

export interface OrganizationT {
  id?: string | null
  organization_name: string
  email: string
  active_until: string
}
