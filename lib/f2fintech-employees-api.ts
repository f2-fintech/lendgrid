import { gqlFetch } from './http-client';

export interface EmployeePayload {
    _id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    designation?: string;
    role_priority?: string;
    image?: string;
    code?: string;
    company_id?: string;
    status?: string;
    joining_date?: string;
}

export interface EmployeeLoginResponse {
    success: boolean;
    message: string;
    token?: string;
    employee?: EmployeePayload;
}

export const f2fintechEmployeesApi = {
    /**
     * HRMS Employee login via GraphQL mutation
     * POST /graphql  →  mutation loginEmployee
     */
    login: (payload: { email: string; password: string }) =>
        gqlFetch<{ loginEmployee: EmployeeLoginResponse }>({
            query: `
        mutation LoginEmployee($email: String!, $password: String!) {
          loginEmployee(loginInput: { email: $email, password: $password }) {
            success
            message
            token
            employee {
              _id
              first_name
              last_name
              email
              designation
              role_priority
              image
              code
              company_id
              status
              joining_date
            }
          }
        }
      `,
            variables: payload,
        }),
};
