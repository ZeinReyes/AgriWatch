import {
  useEffect,
  useState,
} from "react";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import api from "../../services/api";

import "./Settings.css";


const DEFAULT_NOTIFICATIONS = {
  inAppAlerts: true,
  criticalOnly: false,
};


const Settings = () => {

  const [
    settings,
    setSettings
  ] = useState(null);


  const [
    fullName,
    setFullName
  ] = useState("");


  const [
    currentPassword,
    setCurrentPassword
  ] = useState("");


  const [
    newPassword,
    setNewPassword
  ] = useState("");


  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");


  const [
    notifications,
    setNotifications
  ] = useState(
    DEFAULT_NOTIFICATIONS
  );


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    profileSaving,
    setProfileSaving
  ] = useState(false);


  const [
    passwordSaving,
    setPasswordSaving
  ] = useState(false);


  const [
    message,
    setMessage
  ] = useState("");


  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {

    loadSettings();

    loadNotificationPreferences();

  }, []);


  const loadSettings = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get("/settings");


      const data =
        response.data?.settings ||
        null;


      setSettings(data);

      setFullName(
        data?.full_name || ""
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


  const loadNotificationPreferences = () => {

    try {

      const saved =
        localStorage.getItem(
          "agriwatch_notification_preferences"
        );


      if (!saved) {
        return;
      }


      const parsed =
        JSON.parse(saved);


      setNotifications({
        ...DEFAULT_NOTIFICATIONS,
        ...parsed,
      });

    } catch (err) {

      console.error(
        "Failed to load notification preferences:",
        err
      );

    }
  };


  const handleProfileSubmit =
    async (event) => {

      event.preventDefault();

      try {

        setProfileSaving(true);

        setMessage("");
        setError("");


        const response =
          await api.patch(
            "/settings/profile",
            {
              full_name:
                fullName.trim(),
            }
          );


        const updatedUser =
          response.data?.user;


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

        }


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


  const handlePasswordSubmit =
    async (event) => {

      event.preventDefault();

      try {

        setPasswordSaving(true);

        setMessage("");
        setError("");


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


  const updateNotification =
    (
      key
    ) => {

      setNotifications(
        (previous) => {

          const updated = {
            ...previous,
            [key]:
              !previous[key],
          };


          localStorage.setItem(
            "agriwatch_notification_preferences",
            JSON.stringify(
              updated
            )
          );


          return updated;

        }
      );


      setMessage(
        "Notification preferences updated."
      );

      setError("");
    };


  if (loading) {

    return (

      <DashboardLayout>

        <div className="settings-page">

          <div className="settings-state">

            <div className="settings-spinner"></div>

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


  if (error && !settings) {

    return (

      <DashboardLayout>

        <div className="settings-page">

          <div className="settings-state settings-error">

            <div className="settings-state-icon">
              !
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
              onClick={loadSettings}
            >
              Try Again
            </button>

          </div>

        </div>

      </DashboardLayout>

    );
  }


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
              Manage your profile, password,
              and notification preferences.
            </p>

          </div>

        </div>


        {/* =========================================
            MESSAGE
        ========================================== */}

        {message && (

          <div className="settings-message">

            <span>
              ✓
            </span>

            {message}

          </div>

        )}


        {error && (

          <div className="settings-alert-error">

            <span>
              !
            </span>

            {error}

          </div>

        )}


        {/* =========================================
            ACCOUNT
        ========================================== */}

        <section className="settings-section">

          <div className="settings-section-header">

            <div>

              <h2>
                Profile
              </h2>

              <p>
                Update the information associated
                with your AgriWatch account.
              </p>

            </div>

          </div>


          <div className="settings-profile-layout">

            <div className="settings-profile-card">

              <div className="settings-profile-avatar">

                {fullName
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  "U"}

              </div>


              <div>

                <h3>
                  {fullName ||
                    "User"}
                </h3>

                <span>
                  {settings?.role ||
                    "user"}
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

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
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

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  value={
                    settings?.email ||
                    ""
                  }
                  disabled
                />

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

                  {profileSaving
                    ? "Saving..."
                    : "Save Changes"}

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

              <h2>
                Password
              </h2>

              <p>
                Change your current password.
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

              <label>
                Current Password
              </label>

              <input
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

              <label>
                New Password
              </label>

              <input
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

            </div>


            <div className="settings-field">

              <label>
                Confirm New Password
              </label>

              <input
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


            <div className="settings-form-actions">

              <button
                type="submit"
                className="settings-primary-button"
                disabled={
                  passwordSaving
                }
              >

                {passwordSaving
                  ? "Updating..."
                  : "Change Password"}

              </button>

            </div>

          </form>

        </section>


        {/* =========================================
            NOTIFICATIONS
        ========================================== */}

        <section className="settings-section">

          <div className="settings-section-header">

            <div>

              <h2>
                Notifications
              </h2>

              <p>
                Choose how alerts are shown
                inside AgriWatch.
              </p>

            </div>

          </div>


          <div className="settings-preferences">

            <div className="settings-preference">

              <div>

                <strong>
                  In-app alert notifications
                </strong>

                <span>
                  Show monitoring alerts in
                  the notification bell.
                </span>

              </div>


              <button
                type="button"
                className={
                  `settings-switch ${
                    notifications.inAppAlerts
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  updateNotification(
                    "inAppAlerts"
                  )
                }
                aria-pressed={
                  notifications.inAppAlerts
                }
              >

                <span></span>

              </button>

            </div>


            <div className="settings-preference">

              <div>

                <strong>
                  Critical alerts only
                </strong>

                <span>
                  Only show critical alerts
                  in the notification panel.
                </span>

              </div>


              <button
                type="button"
                className={
                  `settings-switch ${
                    notifications.criticalOnly
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  updateNotification(
                    "criticalOnly"
                  )
                }
                aria-pressed={
                  notifications.criticalOnly
                }
              >

                <span></span>

              </button>

            </div>

          </div>

        </section>


        {/* =========================================
            ACCOUNT INFORMATION
        ========================================== */}

        <section className="settings-section settings-account-section">

          <div className="settings-account-row">

            <div>

              <span className="settings-account-label">
                Account Role
              </span>

              <strong>
                {
                  settings?.role
                    ?.charAt(0)
                    ?.toUpperCase() +
                    settings?.role?.slice(1)
                }
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
                          month: "short",
                          day: "numeric",
                          year: "numeric",
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