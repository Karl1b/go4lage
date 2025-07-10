import {
  DashboardInfo,
  UserDetails,
  User,
  NewUser,
  Group,
  Permission,
  ToastDetails,
  Backup,
  Log,
  LogDetail,
  FeedBackT,
  FeedbackMsgT,
} from './types'

interface FetchWithTokenProps {
  url: string
  options: RequestInit
  token: string | null
  toastHeader: string | null
  setToast: ((toast: ToastDetails) => void | null) | null
}

class API {
  apiUrl: string
  constructor() {
    const apiUrlstring = '{%Apiurl%}'

    const trimmedString = apiUrlstring.slice(2, -2).trim()

    if (trimmedString === 'Apiurl') {
      this.apiUrl = 'http://127.0.0.1:8080/adminapi'
    } else {
      this.apiUrl = apiUrlstring + '/adminapi'
    }
  }

  private async fetchWithToken({
    url,
    options,
    token,
    toastHeader,
    setToast,
  }: FetchWithTokenProps) {
    if (!token && setToast) {
      setToast({
        show: true,
        success: false,
        header: 'Token is missing',
        text: 'Try login and out again',
      })
      return
    }

    const headers = new Headers(options.headers)
    headers.append('Authorization', 'Token ' + token)

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      if (setToast) {
        setToast({
          show: true,
          success: false,
          header: 'Error outside go4lage',
          text: `${response.status}`,
        })
      }
      return
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const responseJson = await response.json()

      if (responseJson == null) {
        if (setToast) {
          setToast({
            show: true,
            success: false,
            header: 'Error',
            text: 'Received empty response',
          })
        }
        return
      }

      if (responseJson?.error && setToast) {
        setToast({
          show: true,
          success: false,
          header: toastHeader || 'Toastheader missing',
          text: `${responseJson.detail} ${responseJson.error}`,
        })
        return
      }
      if ((responseJson?.text || responseJson.header) && setToast) {
        console.log('inside correct toat')
        setToast({
          show: true,
          success: true,
          header: toastHeader || 'Toastheader missing',
          text: `${responseJson.header} ${responseJson.text}`,
        })
        return
      }

      return responseJson
    }

    return response
  }

  public async dashboardinfo(): Promise<DashboardInfo> {
    const response = await fetch(this.apiUrl + '/dashboardinfo', {
      method: 'GET',
    })
    const data = await response.json()
    return data
  }

  public async allusers(token: string): Promise<User[] | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/allusers`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response || null
  }

  public async logout(token: string): Promise<null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/logout`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async editGroupPermissions(
    token: string | null,
    groupId: string,
    permissions: Permission[],
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/editgrouppermissions`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Id: groupId },
        body: JSON.stringify(permissions),
      },
      token: token,
      toastHeader: 'Edit Group Permissions',
      setToast: setToast,
    })
  }

  public async createoneuser(
    token: string | null,
    user: NewUser,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/oneuser`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      },
      token: token,
      toastHeader: 'Create User',
      setToast: setToast,
    })
  }

  public async oneuser(
    token: string | null,
    idValue: string
  ): Promise<User | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/oneuser`,
      options: {
        method: 'GET',
        headers: { Id: idValue },
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async editoneuserGroups(
    token: string | null,
    idValue: string,
    groups: Group[],
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/editusergroups`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Id: idValue },
        body: JSON.stringify(groups),
      },
      token: token,
      toastHeader: 'Edit User',
      setToast: setToast,
    })
  }

  public async editoneuserPermissions(
    token: string | null,
    idValue: string,
    permissions: Permission[],
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/edituserpermissions`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Id: idValue },
        body: JSON.stringify(permissions),
      },
      token: token,
      toastHeader: 'Edit User',
      setToast: setToast,
    })
  }

  public async editoneuser(
    token: string | null,
    idValue: string,
    user: NewUser,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/oneuser`,
      options: {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Id: idValue },
        body: JSON.stringify(user),
      },
      token: token,
      toastHeader: 'Edit User',
      setToast: setToast,
    })
  }

  public async getGroups(token: string | null): Promise<Group[]> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getgroups`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async getBackups(token: string | null): Promise<Backup[]> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getbackups`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async getLogs(
    token: string | null,
    uri: string
  ): Promise<Log[] | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getlogs${uri}`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async getErrorLogs(token: string | null): Promise<LogDetail[]> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/geterrorlogs`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async createBackup(
    token: string | null,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/createbackup`,
      options: {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      token: token,
      toastHeader: 'Create Backup',
      setToast: setToast,
    })
  }

  public async downloadBackup(
    token: string | null,
    fileName: string
  ): Promise<Blob | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/downloadbackup`,
      options: {
        method: 'GET',
        headers: { Id: fileName },
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })
    const blob = await response?.blob()
    return blob || null
  }

  public async deletebackup(
    token: string | null,
    fileName: string
  ): Promise<null> {
    await this.fetchWithToken({
      url: `${this.apiUrl}/deletebackup`,
      options: {
        method: 'DELETE',
        headers: { Id: fileName },
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return null
  }

  public async getPermissions(token: string | null): Promise<Permission[]> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getpermissions`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async getGroupById(
    token: string | null,
    groupId: string
  ): Promise<Group | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getgroup`,
      options: {
        method: 'GET',
        headers: { Id: groupId },
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async getPermissionById(
    token: string | null,
    permissionId: string
  ): Promise<Group | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getpermission`,
      options: {
        method: 'GET',
        headers: { Id: permissionId },
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async getPermissionForGroup(
    token: string | null,
    groupId: string
  ): Promise<Permission[]> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/getpermissionsforgroup`,
      options: {
        method: 'GET',
        headers: { Id: groupId },
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })

    return response
  }

  public async login(
    email: string,
    password: string,
    tfa: string | null,
    setToast: (toast: ToastDetails) => void
  ): Promise<UserDetails | null> {
    const response = await fetch(this.apiUrl + '/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        tfa: tfa,
      }),
    })

    if (!response.ok) {
      setToast({
        show: true,
        success: false,
        header: 'Login',
        text: 'Login failed',
      })
      return null
    }

    const responseJson = await response.json()

    if (responseJson.error) {
      setToast({
        show: true,
        success: false,
        header: 'Login',
        text: `${responseJson.detail} ${responseJson.error}`,
      })
      return null
    }

    setToast({
      show: true,
      success: true,
      header: 'Login',
      text: 'Login successful!',
    })
    return responseJson
  }

  public async deletePermission(
    token: string | null,
    permissionId: string,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/deletepermission`,
      options: {
        method: 'DELETE',
        headers: { Id: permissionId },
      },
      token: token,
      toastHeader: 'Delete Permission',
      setToast: setToast,
    })
  }

  public async deleteUser(
    token: string | null,
    userId: string,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/deleteuser`,
      options: {
        method: 'DELETE',
        headers: { Id: userId },
      },
      token: token,
      toastHeader: 'Delete User',
      setToast: setToast,
    })
  }

  public async createGroup(
    token: string | null,
    groupName: string,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/creategroup`,
      options: {
        method: 'PUT',
        body: JSON.stringify({
          name: groupName,
        }),
      },
      token: token,
      toastHeader: 'Create group',
      setToast: setToast,
    })
  }

  public async createPermission(
    token: string | null,
    permissionName: string,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/createpermission`,
      options: {
        method: 'PUT',
        body: JSON.stringify({
          name: permissionName,
        }),
      },
      token: token,
      toastHeader: 'Create Permission',
      setToast: setToast,
    })
  }

  public async deleteGroup(
    token: string | null,
    groupId: string,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/deletegroup`,
      options: {
        method: 'DELETE',
        headers: { Id: groupId },
      },
      token: token,
      toastHeader: 'Delete Group',
      setToast: setToast,
    })
  }

  public async downloadCSVtemplate(token: string): Promise<Blob | null> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/downloadcsvtemplate`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })
    const blob = await response?.blob()
    return blob || null
  }

  public async bulkCreateUsers(
    token: string,
    formData: FormData,
    setToast: (toast: ToastDetails) => void
  ): Promise<void> {
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/bulkcreateusers`,
      options: {
        method: 'POST',
        body: formData,
      },
      token: token,
      toastHeader: 'Bulk Create Users',
      setToast: setToast,
    })

    setToast({
      show: true,
      success: true,
      header: 'Bulk Create Users',
      text: 'Users created successfully!',
    })

    console.log('Users created successfully:', response)
  }

  public async newfeedback(
    token: string | null,
    feedBack: FeedBackT,
    setToast: (toast: ToastDetails) => void
  ) {
    await this.fetchWithToken({
      url: `${this.apiUrl}/newfeedback`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedBack),
      },
      token: token,
      toastHeader: 'Feedback send',
      setToast: setToast,
    })
  }

  public async getMsg(token: string, isAdmin:boolean): Promise<FeedBackT[]> {

    const url = isAdmin ? 'allfeedback' : 'getuserspecificfeedback'
    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/${url}`,
      options: {
        method: 'GET',
      },
      token: token,
      toastHeader: null,
      setToast: null,
    })
    return response || []
  }

  public async updateFeedBack(
    token: string | null,
    feedBack: FeedbackMsgT,
    isAdmin: boolean,
    setToast: (toast: ToastDetails) => void
  ):Promise<FeedBackT> {
    const url = isAdmin ? 'updatefeedbackstaff' : 'updatefeedbackuser'

    const response = await this.fetchWithToken({
      url: `${this.apiUrl}/${url}`,
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedBack),
      },
      token: token,
      toastHeader: 'Feedback send',
      setToast: setToast,
    })
    return response
  }
}

const api = new API()
export default api
