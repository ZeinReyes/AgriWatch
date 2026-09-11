import { Navigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";


const RoleRoute = ({
  allowedRoles,
  children,
}) => {

  const {
    user,
    isAuthenticated,
  } = useAuth();


  // -----------------------------------------
  // Not logged in
  // -----------------------------------------

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );

  }


  // -----------------------------------------
  // User information not loaded
  // -----------------------------------------

  if (!user) {

    return null;

  }


  // -----------------------------------------
  // Check role
  // -----------------------------------------

  if (
    !allowedRoles.includes(user.role)
  ) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );

  }


  return children;
};


export default RoleRoute;