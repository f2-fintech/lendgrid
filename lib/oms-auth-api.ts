import { apiFetch } from "./http-client";

// Using the already existing NEXT_PUBLIC_ADMIN_URL which is the OMS url
// e.g., http://localhost:3010/api/v1
const OMS_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3010/api/v1';

export const omsAuthApi = {
  login: async (payload: { email: string; password: string }) => {
    const data = await apiFetch<any>('/login', {
      method: 'POST',
      body: payload,
      baseUrl: OMS_API_BASE_URL,
      skipCompanyId: true,
    });
    return data?.data; // Based on ResponseFormatter.success(200, 'Login Successful', token) from OMS users.controller.ts
  },
};
