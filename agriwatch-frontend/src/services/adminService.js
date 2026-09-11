import api from "./api";


// =====================================================
// GET ALL USERS
// =====================================================

export const getUsers = async () => {

  const response =
    await api.get(
      "/admin/users"
    );

  return response.data;
};


// =====================================================
// GET SINGLE USER
// =====================================================

export const getUser = async (
  userId
) => {

  const response =
    await api.get(
      `/admin/users/${userId}`
    );

  return response.data;
};


// =====================================================
// UPDATE USER ROLE
// =====================================================

export const updateUserRole = async (
  userId,
  role
) => {

  const response =
    await api.patch(
      `/admin/users/${userId}/role`,
      {
        role,
      }
    );

  return response.data;
};


// =====================================================
// UPDATE USER STATUS
// =====================================================

export const updateUserStatus = async (
  userId,
  isActive
) => {

  const response =
    await api.patch(
      `/admin/users/${userId}/status`,
      {
        is_active: isActive,
      }
    );

  return response.data;
};