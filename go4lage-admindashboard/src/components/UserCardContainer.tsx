import { User } from '../util/types'

import UserCard from './UserCard'

export default function UserCardContainer({ showData }: { showData: User[] }) {
  return (
    <>
      <div className="w-full">
        {showData?.map((user: User) => {
          return (
            <div key={user.id} className="w-full">
              <UserCard user={user} />
            </div>
          )
        })}
      </div>
    </>
  )
}
