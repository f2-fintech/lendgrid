import { gqlFetch } from "./http-client";

export const usersApi = {
  /**
   * User login
   */
  login: (payload: { email: string; password: string; captchaToken: string }) =>
    gqlFetch<{
      login: { success: boolean; message: string; access_token?: string };
    }>({
      query: `
          mutation Login($email: String!, $password: String!, $captchaToken: String!) {
            login(loginInput: { email: $email, password: $password, captchaToken: $captchaToken }) {
              success
              message
              access_token
            }
          }
        `,
      variables: payload,
    }),

  /**
   * User registration
   */
  register: (payload: any) =>
    gqlFetch<{
      createUser: {
        success: boolean;
        message: string;
        companyId?: string;
        companyName?: string;
        user?: {
          _id: string;
          username: string;
          email: string;
          role: string;
        };
      };
    }>({
      query: `
          mutation CreateUser($createUserInput: CreateUserDto!) {
            createUser(createUserInput: $createUserInput) {
              success
              message
              companyId
              companyName
              user {
                _id
                username
                email
                role
              }
            }
          }
        `,
      variables: { createUserInput: { ...payload, role: payload.role ? payload.role.toUpperCase() : undefined } },
    }),

  /**
   * Get current user profile
   */
  profile: () =>
    gqlFetch<{
      profile: {
        _id: string;
        profileId?: string | null;
        username: string;
        email: string;
        role: string;
        status: string;
        contact: string;
        photoUrl: string;
        omsUserId?: string | null;
      };
    }>({
      query: `
          query Profile {
            profile {
              _id
              profileId
              username
              email
              role
              status
              contact
              photoUrl
              omsUserId
            }
          }
        `,
    }),

  /**
   * Get users by role
   */
  findByRole: (role: string, params?: { page?: number; limit?: number; status?: string; searchTerm?: string }) =>
    gqlFetch<{
      usersByRole: {
        results: any[];
        count: number;
        page: number;
        pages: number;
        activeCount: number;
        inactiveCount: number;
      };
    }>({
      query: `
          query UsersByRole($role: Role!, $page: Int, $limit: Int, $status: Status, $searchTerm: String) {
            usersByRole(role: $role, paginationArgs: { page: $page, limit: $limit }, status: $status, searchTerm: $searchTerm) {
              results {
                _id
                username
                email
                contact
                status
                role
                createdAt
                loginHistory
              }
              count
              page
              pages
              activeCount
              inactiveCount
            }
          }
        `,
      variables: { role: role.toUpperCase(), ...params },
    }),

  /**
   * Get all users with pagination
   */
  getUsers: (params?: { page?: number; limit?: number; status?: string }) =>
    gqlFetch<{ users: { results: any[]; count: number; pages: number } }>({
      query: `
          query Users($page: Int, $limit: Int, $status: String) {
            users(paginationArgs: { page: $page, limit: $limit, status: $status }) {
              results {
                _id
                username
                email
                role
                status
              }
              count
              pages
            }
          }
        `,
      variables: params,
    }),

  /**
   * Update user
   */
  updateUser: (payload: { id: string; status?: string;[key: string]: any }) =>
    gqlFetch<{
      updateUser: {
        _id: string;
        username: string;
        email: string;
        status: string;
        contact: string;
        photoUrl: string;
      };
    }>({
      query: `
          mutation UpdateUser($updateUserInput: UpdateUserDto!) {
            updateUser(updateUserInput: $updateUserInput) {
              _id
              username
              email
              status
              contact
              photoUrl
            }
          }
        `,
      variables: { updateUserInput: { ...payload, _id: payload._id } },
    }),

  /**
   * Delete user
   */
  remove: (id: string) =>
    gqlFetch<{
      removeUser: {
        _id: string;
        username: string;
        status: string;
      };
    }>({
      query: `
          mutation RemoveUser($id: ID!) {
            removeUser(id: $id) {
              _id
              username
              status
            }
          }
        `,
      variables: { id },
    }),

  /**
   * Request password reset link
   * UPDATED: Fixed to match Boolean return type from backend
   */
  forgotPassword: (email: string) =>
    gqlFetch<{ forgotPassword: { success: boolean; message: string } }>({
      query: `
          mutation ForgotPassword($email: String!) {
            forgotPassword(email: $email) {
             success
             message
            }
     }
        `,
      variables: { email },
    }),

  /**
   * Reset password using token from email
   */
  resetPassword: (payload: { token: string; newPassword: string }) =>
    gqlFetch<{ resetPassword: { success: boolean; message: string } }>({
      query: `
          mutation ResetPassword($token: String!, $newPassword: String!) {
            resetPassword(token: $token, newPassword: $newPassword) {
            success
            message
          }
        }
        `,
      variables: {
        token: payload.token,
        newPassword: payload.newPassword,
      },
    }),

  /**
   * Request account deletion
   */
  requestDeletion: (payload: { email: string; password: string; reason?: string }) =>
    gqlFetch<{
      requestAccountDeletion: { success: boolean; message: string };
    }>({
      query: `
          mutation RequestAccountDeletion($email: String!, $password: String!, $reason: String) {
            requestAccountDeletion(email: $email, password: $password, reason: $reason) {
              success
              message
            }
          }
        `,
      variables: payload,
    }),

  /**
   * Get all account deletion requests
   */
  getDeletionRequests: (params?: { page?: number; limit?: number }) =>
    gqlFetch<{
      findAllDeletionRequests: {
        success: boolean;
        message: string;
        results: any[];
        count: number;
        page: number;
        pages: number;
      };
    }>({
      query: `
          query FindAllDeletionRequests($page: Int, $limit: Int) {
            findAllDeletionRequests(paginationArgs: { page: $page, limit: $limit }) {
              success
              message
              results {
                _id
                userId
                email
                username
                reason
                parentAggregatorId
                status
                eligible
                createdAt
                updatedAt
              }
              count
              page
              pages
            }
          }
        `,
      variables: params,
    }),

  /**
   * Process a deletion request
   */
  processDeletionRequest: (payload: { id: string; action: string }) =>
    gqlFetch<{
      processDeletionRequest: { success: boolean; message: string };
    }>({
      query: `
          mutation ProcessDeletionRequest($id: ID!, $action: DeletionRequestAction!) {
            processDeletionRequest(id: $id, action: $action) {
              success
              message
            }
          }
        `,
      variables: payload,
    }),
};
