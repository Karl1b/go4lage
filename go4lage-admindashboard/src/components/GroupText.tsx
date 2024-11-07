export function GroupText() {
  return (
    <>
      <p>
        Groups are collections of users that share common access needs in your
        application. The simplest way to manage access is to use groups as
        permissions themselves (e.g., "admin", "editor", "viewer"). For more
        sophisticated access control, you can assign additional permissions to
        groups, which are then automatically granted to all group members.
      </p>
      <p>
        Behind the scenes, both groups and permissions are implemented as simple
        strings, making them lightweight and flexible.
      </p>
    </>
  )
}
