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
} from './types'

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

  private async fetchWithToken(
    url: string,
    options: RequestInit,
    token: string | null
  ) {
    if (!token) throw new Error('Token is required')

    const headers = new Headers(options.headers)
    headers.append('Authorization', 'Token ' + token)

    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response
  }

  public async dashboardinfo(): Promise<DashboardInfo> {
    try {
      const response = await fetch(this.apiUrl + '/dashboardinfo', {
        method: 'GET',
      })

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching dashboard info:', error.message)
      }
      throw error
    }
  }

  public async allusers(token: string): Promise<User[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/allusers`,
        {
          method: 'GET',
        },
        token
      )

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching all users:', error.message)
      }
      throw error
    }
  }

  public async logout(token: string): Promise<null> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/logout`,
        {
          method: 'GET',
        },
        token
      )

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error logging out:', error.message)
      }
      throw error
    }
  }

  public async editGroupPermissions(
    token: string | null,
    groupId: string,
    permissions: Permission[],
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/editgrouppermissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', GroupId: groupId },
          body: JSON.stringify(permissions),
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Edit Group Permissions',
        text: 'Permissions updated successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Edit Group Permissions',
          text: `Error updating permissions: ${error.message}`,
        })

        console.error('Error editing group permissions:', error.message)
      }
      throw error
    }
  }

  public async createoneuser(
    token: string | null,
    user: NewUser,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/oneuser`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Create User',
        text: 'User created successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Create User',
          text: `Error creating user: ${error.message}`,
        })

        console.error('Error creating a user:', error.message)
      }
      throw error
    }
  }

  public async oneuser(
    token: string | null,
    idValue: string
  ): Promise<User | null> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/oneuser`,
        {
          method: 'GET',
          headers: { UserId: idValue },
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching user:', error.message)
      }
      throw error
    }
  }

  public async editoneuserGroups(
    token: string | null,
    idValue: string,
    groups: Group[],
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/editusergroups`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', UserId: idValue },
          body: JSON.stringify(groups),
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Edit User',
        text: 'User updated successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Edit User',
          text: `Error updating user: ${error.message}`,
        })

        console.error('Error editing user:', error.message)
      }
      throw error
    }
  }

  public async editoneuser(
    token: string | null,
    idValue: string,
    user: NewUser,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/oneuser`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', UserId: idValue },
          body: JSON.stringify(user),
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Edit User',
        text: 'User updated successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Edit User',
          text: `Error updating user: ${error.message}`,
        })

        console.error('Error editing user:', error.message)
      }
      throw error
    }
  }

  public async getGroups(token: string | null): Promise<Group[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getgroups`,
        {
          method: 'GET',
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching groups:', error.message)
      }
      throw error
    }
  }

  public async getBackups(token: string | null): Promise<Backup[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getbackups`,
        {
          method: 'GET',
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching backups:', error.message)
      }
      throw error
    }
  }

  public async getLogs(token: string | null, uri: string): Promise<Log[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getlogs${uri}`,
        {
          method: 'GET',
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching logs:', error.message)
      }
      throw error
    }
  }

  public async getErrorLogs(token: string | null): Promise<LogDetail[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/geterrorlogs`,
        {
          method: 'GET',
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching logs:', error.message)
      }
      throw error
    }
  }

  public async createBackup(
    token: string | null,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/createbackup`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Create Backup',
        text: 'Created Backup Successfully',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Create User',
          text: `Error creating Backup: ${error.message}`,
        })

        console.error('Error creating a backup:', error.message)
      }
      throw error
    }
  }

  public async downloadBackup(
    token: string | null,
    fileName: string
  ): Promise<Blob> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/downloadbackup`,
        {
          method: 'GET',
          headers: {
            FileName: fileName,
          },
        },
        token
      )
      const blob = await response.blob()
      return blob
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading Backup:', error.message)
      }
      throw error
    }
  }

  public async deletebackup(
    token: string | null,
    fileName: string
  ): Promise<null> {
    try {
      console.log(fileName)
      await this.fetchWithToken(
        `${this.apiUrl}/deletebackup`,
        {
          method: 'DELETE',
          headers: {
            FileName: fileName,
          },
        },
        token
      )

      return null
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading Backup:', error.message)
      }
      throw error
    }
  }

  public async getPermissions(token: string | null): Promise<Permission[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getpermissions`,
        {
          method: 'GET',
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching permissions:', error.message)
      }
      throw error
    }
  }

  public async getGroupById(
    token: string | null,
    groupId: string
  ): Promise<Group | null> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getgroup`,
        {
          method: 'GET',
          headers: { GroupId: groupId },
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching group by ID:', error.message)
      }
      throw error
    }
  }
  public async getPermissionById(
    token: string | null,
    permissionId: string
  ): Promise<Group | null> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getpermission`,
        {
          method: 'GET',
          headers: { PermissionId: permissionId },
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching group by ID:', error.message)
      }
      throw error
    }
  }

  public async getPermissionForGroup(
    token: string | null,
    groupId: string
  ): Promise<Permission[]> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/getpermissionsforgroup`,
        {
          method: 'GET',
          headers: { GroupId: groupId },
        },
        token
      )
      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching permissions for group:', error.message)
      }
      throw error
    }
  }

  public async login(
    email: string,
    password: string,
    tfa: string | null,
    setToast: (toast: ToastDetails) => void
  ): Promise<UserDetails | null> {
    try {
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
        throw new Error('Login failed')
      }

      const data: UserDetails = await response.json()
      setToast({
        show: true,
        success: true,
        header: 'Login',
        text: 'Login successful!',
      })
      return data
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Login',
          text: `Login failed: ${error.message}`,
        })
      }

      return null
    }
  }

  public async deletePermission(
    token: string | null,
    permissionId: string,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/deletepermission`,
        {
          method: 'DELETE',
          headers: { PermissionId: permissionId },
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Delete Permission',
        text: 'Permission deleted successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Delete Permission',
          text: `Error deleting permission: ${error.message}`,
        })

        console.error('Error deleting a permission:', error.message)
      }
      throw error
    }
  }

  public async deleteUser(
    token: string | null,
    userId: string,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/deleteuser`,
        {
          method: 'DELETE',
          headers: { UserId: userId },
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Delete User',
        text: 'User deleted successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Delete User',
          text: `Error deleting user: ${error.message}`,
        })

        console.error('Error deleting a user:', error.message)
      }
      throw error
    }
  }

  public async createGroup(
    token: string | null,
    groupName: string,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/creategroup`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: groupName,
          }),
        },
        token
      )
      setToast({
        show: true,
        success: true,
        header: 'Create group',
        text: 'Group created successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Create group',
          text: `Error creating group: ${error.message}`,
        })

        console.error('Error creating a group:', error.message)
      }
      throw error
    }
  }

  public async createPermission(
    token: string | null,
    permissionName: string,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/createpermission`,
        {
          method: 'PUT',
          body: JSON.stringify({
            name: permissionName,
          }),
        },
        token
      )
      setToast({
        show: true,
        success: true,
        header: 'Create group',
        text: 'Group created successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Create group',
          text: `Error creating group: ${error.message}`,
        })

        console.error('Error creating a group:', error.message)
      }
      throw error
    }
  }

  public async deleteGroup(
    token: string | null,
    groupId: string,
    setToast: (toast: ToastDetails) => void
  ) {
    try {
      await this.fetchWithToken(
        `${this.apiUrl}/deletegroup`,
        {
          method: 'DELETE',
          headers: { GroupId: groupId },
        },
        token
      )

      setToast({
        show: true,
        success: true,
        header: 'Delete Group',
        text: 'Group deleted successfully!',
      })
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Delete Group',
          text: `Error deleting group: ${error.message}`,
        })

        console.error('Error deleting a group:', error.message)
      }
      throw error
    }
  }

  public async downloadCSVtemplate(token: string): Promise<Blob> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/downloadcsvtemplate`,
        {
          method: 'GET',
        },
        token
      )
      const blob = await response.blob()
      return blob
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading CSV template:', error.message)
      }
      throw error
    }
  }

  public async bulkCreateUsers(
    token: string,
    formData: FormData,
    setToast: (toast: ToastDetails) => void
  ): Promise<void> {
    try {
      const response = await this.fetchWithToken(
        `${this.apiUrl}/bulkcreateusers`,
        {
          method: 'POST',
          body: formData,
        },
        token
      )
      const data = await response.json()

      setToast({
        show: true,
        success: true,
        header: 'Bulk Create Users',
        text: 'Users created successfully!',
      })

      console.log('Users created successfully:', data)
    } catch (error) {
      if (error instanceof Error) {
        setToast({
          show: true,
          success: false,
          header: 'Bulk Create Users',
          text: `Error creating users: ${error.message}`,
        })

        console.error('Error creating users:', error.message)
      }
      throw error
    }
  }
}

const api = new API()
export default api
