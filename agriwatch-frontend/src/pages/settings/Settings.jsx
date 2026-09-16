import {
  useEffect,
  useState,
} from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";

import api from "../../services/api";

import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  LockKeyhole,
  Mail,
  RefreshCw,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import "./Settings.css";


const Settings = () => {

  const [
    settings,
    setSettings,
  ] = useState(null);


  const [
    fullName,
    setFullName,
  ] = useState("");


  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");


  const [
    newPassword,
    setNewPassword,
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    profileSaving,
    setProfileSaving,
  ] = useState(false);


  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  // =========================================================
  // LOAD SETTINGS
  // =========================================================

  useEffect(() => {
    loadSettings();
  }, []);


  const loadSettings = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/settings"
        );


      const data =
        response.data?.settings ||
        null;


      setSettings(
        data
      );

      setFullName(
        data?.full_name ||
        ""
      );

    } catch (err) {

      console.error(
        "Failed to load settings:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load settings."
      );

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // PROFILE
  // =========================================================

  const handleProfileSubmit =
    async (event) => {

      event.preventDefault();

      const trimmedName =
        fullName.trim();


      if (!trimmedName) {

        setError(
          "Full name is required."
        );

        setMessage("");

        return;
      }


      try {

        setProfileSaving(true);

        setMessage("");
        setError("");


        const response =
          await api.patch(
            "/settings/profile",
            {
              full_name:
                trimmedName,
            }
          );


        const updatedUser =
          response.data?.user ||
          {};


        setSettings(
          (previous) => ({
            ...previous,
            ...updatedUser,
          })
        );


        const storedUser =
          localStorage.getItem(
            "agriwatch_user"
          );


        if (storedUser) {

          try {

            const parsedUser =
              JSON.parse(
                storedUser
              );


            localStorage.setItem(
              "agriwatch_user",
              JSON.stringify({
                ...parsedUser,
                ...updatedUser,
              })
            );

          } catch (storageError) {

            console.error(
              "Failed to update stored user:",
              storageError
            );

          }
        }


        setFullName(
          updatedUser.full_name ||
          trimmedName
        );


        setMessage(
          "Your profile has been updated."
        );

    } catch (err) {

        console.error(
          "Failed to update profile:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to update your profile."
        );

      } finally {

        setProfileSaving(false);

      }
    };


  // =========================================================
  // PASSWORD
  // =========================================================

  const handlePasswordSubmit =
    async (event) => {

      event.preventDefault();

      setMessage("");
      setError("");


      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          "New password and confirmation password do not match."
        );

        return;
      }


      if (
        newPassword.length <
        8
      ) {

        setError(
          "New password must be at least 8 characters long."
        );

        return;
      }


      try {

        setPasswordSaving(true);


        await api.post(
          "/settings/password",
          {
            current_password:
              currentPassword,

            new_password:
              newPassword,

            confirm_password:
              confirmPassword,
          }
        );


        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");


        setMessage(
          "Your password has been changed successfully."
        );

      } catch (err) {

        console.error(
          "Failed to change password:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Unable to change your password."
        );

      } finally {

        setPasswordSaving(false);

      }
    };


  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {

    return (

      <DashboardLayout>

        <div className="settings-page">

          <div className="settings-state">

            <div className="settings-spinner">

              <Loader2
                size={25}
                strokeWidth={2}
                className="settings-spin"
                aria-hidden="true"
              />

            </div>

            <h3>
              Loading settings
            </h3>

            <p>
              Retrieving your account settings.
            </p>

          </div>

        </div>

      </DashboardLayout>

    );
  }


  // =========================================================
  // ERROR STATE
  // =========================================================

  if (error && !settings) {

    return (

      <DashboardLayout>

        <div className="settings-page">

          <div className="settings-state settings-error">

            <div className="settings-state-icon">

              <CircleAlert
                size={28}
                strokeWidth={1.9}
                aria-hidden="true"
              />

            </div>

            <h3>
              Settings unavailable
            </h3>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="settings-retry-button"
              onClick={
                loadSettings
              }
            >

              <RefreshCw
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Try Again
              </span>

            </button>

          </div>

        </div>

      </DashboardLayout>

    );
  }


  // =========================================================
  // USER INITIAL
  // =========================================================

  const userInitial =
    fullName
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  const formattedRole =
    settings?.role
      ? settings.role
          .charAt(0)
          .toUpperCase() +
        settings.role.slice(1)
      : "User";


  // =========================================================
  // RENDER
  // =========================================================

  return (

    <DashboardLayout>

      <div className="settings-page">

        {/* =========================================
            HEADER
        ========================================== */}

        <div className="settings-header">

          <div>

            <span className="settings-eyebrow">
              ACCOUNT
            </span>

            <h1>
              Settings
            </h1>

            <p>
              Manage your profile and
              account security.
            </p>

          </div>

        </div>


        {/* =========================================
            MESSAGE
        ========================================== */}

        {message && (

          <div className="settings-message">

            <CheckCircle2
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {message}
            </span>

          </div>

        )}


        {error && (

          <div className="settings-alert-error">

            <CircleAlert
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =========================================
            PROFILE
        ========================================== */}

        <section className="settings-section">

          <div className="settings-section-header">

            <div>

              <div className="settings-title-row">

                <UserRound
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <h2>
                  Profile
                </h2>

              </div>

              <p>
                Update the information associated
                with your AgriWatch account.
              </p>

            </div>

          </div>


          <div className="settings-profile-layout">

            <div className="settings-profile-card">

              <div className="settings-profile-avatar">

                {userInitial}

              </div>


              <div>

                <h3>
                  {fullName ||
                    "User"}
                </h3>

                <span>
                  {formattedRole}
                </span>

              </div>

            </div>


            <form
              className="settings-form"
              onSubmit={
                handleProfileSubmit
              }
            >

              <div className="settings-field">

                <label htmlFor="full_name">
                  Full Name
                </label>

                <input
                  id="full_name"
                  type="text"
                  value={
                    fullName
                  }
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  maxLength={150}
                  required
                />

              </div>


              <div className="settings-field">

                <label htmlFor="email_address">
                  Email Address
                </label>

                <div className="settings-input-with-icon">

                  <Mail
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <input
                    id="email_address"
                    type="email"
                    value={
                      settings?.email ||
                      ""
                    }
                    disabled
                  />

                </div>

                <small>
                  Your email address is used
                  for account authentication.
                </small>

              </div>


              <div className="settings-form-actions">

                <button
                  type="submit"
                  className="settings-primary-button"
                  disabled={
                    profileSaving
                  }
                >

                  {profileSaving ? (

                    <>
                      <Loader2
                        size={17}
                        className="settings-spin"
                        aria-hidden="true"
                      />

                      <span>
                        Saving...
                      </span>
                    </>

                  ) : (

                    <>
                      <Save
                        size={17}
                        strokeWidth={2}
                        aria-hidden="true"
                      />

                      <span>
                        Save Changes
                      </span>
                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </section>


        {/* =========================================
            PASSWORD
        ========================================== */}

        <section className="settings-section">

          <div className="settings-section-header">

            <div>

              <div className="settings-title-row">

                <LockKeyhole
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <h2>
                  Password
                </h2>

              </div>

              <p>
                Change your current password
                to keep your account secure.
              </p>

            </div>

          </div>


          <form
            className="settings-form settings-password-form"
            onSubmit={
              handlePasswordSubmit
            }
          >

            <div className="settings-field">

              <label htmlFor="current_password">
                Current Password
              </label>

              <input
                id="current_password"
                type="password"
                value={
                  currentPassword
                }
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your current password"
                required
              />

            </div>


            <div className="settings-field">

              <label htmlFor="new_password">
                New Password
              </label>

              <input
                id="new_password"
                type="password"
                value={
                  newPassword
                }
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="At least 8 characters"
                minLength={8}
                required
              />

              <small>
                Use at least 8 characters
                for your new password.
              </small>

            </div>


            <div className="settings-field">

              <label htmlFor="confirm_password">
                Confirm New Password
              </label>

              <input
                id="confirm_password"
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Repeat your new password"
                minLength={8}
                required
              />

            </div>


            <div className="settings-password-security">

              <ShieldCheck
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Your password is securely
                handled by the AgriWatch
                authentication system.
              </span>

            </div>


            <div className="settings-form-actions">

              <button
                type="submit"
                className="settings-primary-button"
                disabled={
                  passwordSaving
                }
              >

                {passwordSaving ? (

                  <>
                    <Loader2
                      size={17}
                      className="settings-spin"
                      aria-hidden="true"
                    />

                    <span>
                      Updating...
                    </span>
                  </>

                ) : (

                  <>
                    <LockKeyhole
                      size={17}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                    <span>
                      Change Password
                    </span>
                  </>

                )}

              </button>

            </div>

          </form>

        </section>


        {/* =========================================
            ACCOUNT INFORMATION
        ========================================== */}

        <section className="settings-section settings-account-section">

          <div className="settings-section-header">

            <div>

              <div className="settings-title-row">

                <ShieldCheck
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <h2>
                  Account Information
                </h2>

              </div>

              <p>
                Current details and status
                of your AgriWatch account.
              </p>

            </div>

          </div>


          <div className="settings-account-row">

            <div>

              <span className="settings-account-label">
                Account Role
              </span>

              <strong>
                {formattedRole}
              </strong>

            </div>


            <div>

              <span className="settings-account-label">
                Account Status
              </span>

              <strong className="settings-account-active">
                Active
              </strong>

            </div>


            <div>

              <span className="settings-account-label">
                Member Since
              </span>

              <strong>
                {
                  settings?.created_at
                    ? new Date(
                        settings.created_at
                      ).toLocaleDateString(
                        "en-PH",
                        {
                          month:
                            "short",
                          day:
                            "numeric",
                          year:
                            "numeric",
                        }
                      )
                    : "—"
                }
              </strong>

            </div>

          </div>

        </section>

      </div>

    </DashboardLayout>

  );
};


export default Settings;