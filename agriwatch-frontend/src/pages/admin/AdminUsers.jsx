import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../../services/adminService";

import DashboardLayout from "../../components/dashboard/DashboardLayout";
import RoleBadge from "../../components/dashboard/RoleBadge";
import { useAuth } from "../../context/AuthContext";


const AdminUsers = () => {
  const { user: currentUser } =
    useAuth();

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [updatingId, setUpdatingId] =
    useState(null);


  // =======================================================
  // LOAD USERS
  // =======================================================

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const data =
        await getUsers();

      setUsers(
        data.users || []
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadUsers();
  }, []);


  // =======================================================
  // FILTER USERS
  // =======================================================

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) => {

        const searchValue =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          !searchValue ||
          user.full_name
            ?.toLowerCase()
            .includes(searchValue) ||
          user.email
            ?.toLowerCase()
            .includes(searchValue);

        const matchesRole =
          roleFilter === "all" ||
          user.role === roleFilter;

        const matchesStatus =
          statusFilter === "all" ||
          (
            statusFilter === "active"
              ? user.is_active
              : !user.is_active
          );

        return (
          matchesSearch &&
          matchesRole &&
          matchesStatus
        );
      }
    );
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);


  // =======================================================
  // CHANGE ROLE
  // =======================================================

  const handleRoleChange = async (
    userId,
    newRole
  ) => {

    setUpdatingId(userId);
    setError("");

    try {
      const data =
        await updateUserRole(
          userId,
          newRole
        );

      setUsers(
        (previousUsers) =>
          previousUsers.map(
            (user) =>
              user.id === userId
                ? data.user
                : user
          )
      );

    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update user role."
      );
    } finally {
      setUpdatingId(null);
    }
  };


  // =======================================================
  // CHANGE STATUS
  // =======================================================

  const handleStatusChange = async (
    userId,
    currentStatus
  ) => {

    setUpdatingId(userId);
    setError("");

    try {
      const data =
        await updateUserStatus(
          userId,
          !currentStatus
        );

      setUsers(
        (previousUsers) =>
          previousUsers.map(
            (user) =>
              user.id === userId
                ? data.user
                : user
          )
      );

    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update user status."
      );
    } finally {
      setUpdatingId(null);
    }
  };


  // =======================================================
  // STATS
  // =======================================================

  const totalUsers =
    users.length;

  const farmers =
    users.filter(
      (user) =>
        user.role === "farmer"
    ).length;

  const viewers =
    users.filter(
      (user) =>
        user.role === "viewer"
    ).length;

  const activeUsers =
    users.filter(
      (user) =>
        user.is_active
    ).length;


  return (
    <DashboardLayout>
      <div className="admin-users-page">

        {/* HEADER */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">
              ADMINISTRATION
            </div>

            <h1>
              User Management
            </h1>

            <p>
              Manage AgriWatch users,
              roles, and account access.
            </p>
          </div>
        </div>


        {/* ERROR */}
        {error && (
          <div className="admin-alert-error">
            <span>!</span>
            {error}
          </div>
        )}


        {/* STATS */}
        <div className="admin-user-stats">

          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              👥
            </div>

            <div>
              <div className="admin-stat-value">
                {totalUsers}
              </div>

              <div className="admin-stat-label">
                Total users
              </div>
            </div>
          </div>


          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              🌱
            </div>

            <div>
              <div className="admin-stat-value">
                {farmers}
              </div>

              <div className="admin-stat-label">
                Farmers
              </div>
            </div>
          </div>


          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              👁
            </div>

            <div>
              <div className="admin-stat-value">
                {viewers}
              </div>

              <div className="admin-stat-label">
                Viewers
              </div>
            </div>
          </div>


          <div className="admin-stat-card">
            <div className="admin-stat-icon">
              ✓
            </div>

            <div>
              <div className="admin-stat-value">
                {activeUsers}
              </div>

              <div className="admin-stat-label">
                Active accounts
              </div>
            </div>
          </div>

        </div>


        {/* USERS CARD */}
        <div className="admin-users-card">

          <div className="admin-users-card-header">

            <div>
              <h2>
                AgriWatch Accounts
              </h2>

              <p>
                {filteredUsers.length} users
                displayed
              </p>
            </div>

          </div>


          {/* FILTERS */}
          <div className="admin-filters">

            <div className="admin-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>


            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All roles
              </option>

              <option value="admin">
                Administrators
              </option>

              <option value="farmer">
                Farmers
              </option>

              <option value="viewer">
                Viewers
              </option>
            </select>


            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

          </div>


          {/* TABLE */}
          <div className="admin-table-wrapper">

            {loading ? (
              <div className="admin-loading">
                <span className="button-spinner admin-spinner" />
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (

              <div className="admin-empty">
                <div>
                  🔍
                </div>

                <h3>
                  No users found
                </h3>

                <p>
                  Try adjusting your search
                  or filters.
                </p>
              </div>

            ) : (

              <table className="admin-users-table">

                <thead>
                  <tr>
                    <th>
                      User
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {filteredUsers.map(
                    (user) => {

                      const isCurrentUser =
                        currentUser?.id ===
                        user.id;

                      const isUpdating =
                        updatingId ===
                        user.id;

                      return (
                        <tr
                          key={user.id}
                        >

                          {/* USER */}
                          <td>
                            <div className="admin-user-cell">

                              <div className="admin-user-avatar">
                                {user.full_name
                                  ?.charAt(0)
                                  ?.toUpperCase()}
                              </div>

                              <div>
                                <div className="admin-user-name">
                                  {user.full_name}

                                  {isCurrentUser && (
                                    <span className="you-badge">
                                      You
                                    </span>
                                  )}
                                </div>

                                <div className="admin-user-email">
                                  {user.email}
                                </div>
                              </div>

                            </div>
                          </td>


                          {/* ROLE */}
                          <td>

                            {user.role ===
                            "admin" ? (

                              <RoleBadge
                                role="admin"
                              />

                            ) : (

                              <select
                                className="role-select"
                                value={
                                  user.role
                                }
                                disabled={
                                  isUpdating
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleRoleChange(
                                    user.id,
                                    event.target
                                      .value
                                  )
                                }
                              >

                                <option value="farmer">
                                  Farmer
                                </option>

                                <option value="viewer">
                                  Viewer
                                </option>

                              </select>

                            )}

                          </td>


                          {/* STATUS */}
                          <td>

                            <span
                              className={
                                user.is_active
                                  ? "status-badge status-active"
                                  : "status-badge status-inactive"
                              }
                            >
                              <span className="status-dot" />

                              {user.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>

                          </td>


                          {/* DATE */}
                          <td>

                            <span className="admin-date">
                              {user.created_at
                                ? new Date(
                                    user.created_at
                                  ).toLocaleDateString(
                                    undefined,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )
                                : "—"}
                            </span>

                          </td>


                          {/* ACTION */}
                          <td>

                            {user.role ===
                            "admin" ? (

                              <span className="protected-label">
                                Protected
                              </span>

                            ) : (

                              <button
                                className={
                                  user.is_active
                                    ? "user-action-button deactivate"
                                    : "user-action-button activate"
                                }
                                disabled={
                                  isUpdating
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    user.id,
                                    user.is_active
                                  )
                                }
                              >
                                {isUpdating
                                  ? "Updating..."
                                  : user.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;