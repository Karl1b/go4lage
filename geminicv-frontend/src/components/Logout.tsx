import { useContext } from "react";
import { MainContext } from "../App";
import { UserDetails } from "../util/types";
import Button from "../stylecomponents/Button";

export default function Logout() {
  const { setUserData } = useContext(MainContext);

  function logout() {
    const emptyUser: UserDetails = { email: null, token: null };
    setUserData(emptyUser);
  }

  return (
    <>
      <Button onClick={logout} kind="secondary">
        Logout
      </Button>
    </>
  );
}
