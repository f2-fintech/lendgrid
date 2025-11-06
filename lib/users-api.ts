import { gqlFetch } from './http-client'

export const usersApi = {
  /**
   * User login
   */
  login: (payload: { email: string; password: string }) =>
    gqlFetch<{ login: { success: boolean; message: string; access_token?: string } }>({
      query: `
        mutation Login($email: String!, $password: String!) {
          login(loginInput: { email: $email, password: $password }) {
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
        user?: {
          _id: string;
          username: string;
          email: string;
          role: string;
          companyName?: string;
        };
      };
    }>({
      query: `
        mutation CreateUser($createUserInput: CreateUserDto!) {
          createUser(createUserInput: $createUserInput) {
            success
            message
            user {
              _id
              username
              email
              role
              companyName
            }
          }
        }
      `,
      variables: { createUserInput: payload },
    }),

  /**
   * Get current user profile
   */
  profile: () =>
    gqlFetch<{
      profile: {
        _id: string;
        username: string;
        email: string;
        role: string;
      };
    }>({
      query: `
        query Profile {
          profile {
            _id
            username
            email
            role
          }
        }
      `,
    }),

  /**
   * Get users by role
   */
  findByRole: (role: string, params?: { page?: number; limit?: number }) =>
    gqlFetch<{ usersByRole: { results: any[]; count: number; page: number; pages: number } }>({
      query: `
        query UsersByRole($role: Role!, $page: Int, $limit: Int) {
          usersByRole(role: $role, paginationArgs: { page: $page, limit: $limit }) {
            results {
              _id
              username
              email
              contact
              createdAt
              companyName
              gender
              address
              pincode
              lenderType
              profilePicture
              status
              role
              loginHistory
            }
            count
            page
            pages
          }
        }
      `,
      variables: { role, ...params },
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
        email: string;
        role: string;
        status: string;
      };
    }>({
      query: `
        mutation UpdateUser($updateUserInput: UpdateUserDto!) {
          updateUser(updateUserInput: $updateUserInput) {
            _id
            email
            role
            status
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
        status: string;
      };
    }>({
      query: `
        mutation RemoveUser($id: ID!) {
          removeUser(id: $id) {
            _id
            status
          }
        }
      `,
      variables: { id },
    }),
}
