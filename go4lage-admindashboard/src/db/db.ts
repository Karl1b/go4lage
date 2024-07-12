// db.ts
import Dexie, { Table } from 'dexie'
import { User } from '../util/types'



export class Go4lageDb extends Dexie {

  users!: Table<User>
  constructor() {
    super('go4lageDb')
    this.version(8).stores({
      users: '&id,created_at,email,first_name,last_name,is_active,is_superuser,last_login,groups,username',
    })
  }
}


export const db = new Go4lageDb()
