import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";


const AuthContext = createContext(null);


export const AuthProvider = ({
  children,
}) => {

  const [
    user,
    setUser
  ] = useState(null);


  const [
    token,
    setToken
  ] = useState(
    localStorage.getItem(
      "agriwatch_token"
    )
  );


  // =========================================
  // LOAD STORED USER
  // =========================================

  useEffect(() => {

    const storedUser =
      localStorage.getItem(
        "agriwatch_user"
      );


    if (storedUser) {

      try {

        setUser(
          JSON.parse(storedUser)
        );

      } catch (error) {

        console.error(
          "Unable to load stored user:",
          error
        );

        localStorage.removeItem(
          "agriwatch_user"
        );

      }

    }

  }, []);


  // =========================================
  // LOGIN
  // =========================================

  const login = (loginData) => {

    const accessToken =
      loginData.access_token;

    const loggedInUser =
      loginData.user;


    localStorage.setItem(
      "agriwatch_token",
      accessToken
    );


    localStorage.setItem(
      "agriwatch_user",
      JSON.stringify(
        loggedInUser
      )
    );


    setToken(accessToken);

    setUser(loggedInUser);
  };


  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    localStorage.removeItem(
      "agriwatch_token"
    );

    localStorage.removeItem(
      "agriwatch_user"
    );


    setToken(null);

    setUser(null);
  };


  // =========================================
  // ROLE HELPERS
  // =========================================

  const hasRole = (role) => {

    return user?.role === role;

  };


  const hasAnyRole = (roles) => {

    return roles.includes(
      user?.role
    );

  };


  // =========================================
  // CONTEXT
  // =========================================

  return (
    <AuthContext.Provider
      value={{
        user,
        token,

        isAuthenticated:
          !!token,

        login,
        logout,

        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () =>
  useContext(AuthContext);