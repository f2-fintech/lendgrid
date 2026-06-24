import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/users-api";
import { queryKeys } from "@/lib/query-keys";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation"; 

interface UseUsersProps {
  page?: number;
  limit?: number;
  status?: string;
  enabled?: boolean;
}

/**
 * Fetch current user profile
 */
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: async () => {
      const response = await usersApi.profile();
      return response.profile;
    },
    enabled,
  });
}

/**
 * Fetch users by role
 */
export function useUsersByRole(
  role: string,
  { page = 1, limit = 10, status, searchTerm, enabled = true }: UseUsersProps & { searchTerm?: string } = {},
) {
  return useQuery({
    queryKey: queryKeys.users.byRole(role, page, limit, status, searchTerm),
    queryFn: async () => {
      const response = await usersApi.findByRole(role, { page, limit, status, searchTerm });
      return response.usersByRole;
    },
    enabled: enabled && !!role,
  });
}

/**
 * Fetch all users
 */
export function useUsers({
  page = 1,
  limit = 10,
  status,
  enabled = true,
}: UseUsersProps = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(page, limit, status),
    queryFn: async () => {
      const response = await usersApi.getUsers({ page, limit, status });
      return response.users;
    },
    enabled,
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      captchaToken: string;
    }) => usersApi.login(payload),
    onSuccess: (data) => {
      if (data?.login?.success && data?.login?.access_token) {
        // Store token in cookie
        document.cookie = `token=${encodeURIComponent(
          data.login.access_token,
        )}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: any) => usersApi.register(payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User registered successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register",
        variant: "destructive",
      });
    },
  });
}

/**
 * Update user mutation
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      id: string;
      status?: string;
      [key: string]: any;
    }) => usersApi.updateUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });
}

/**
 * Delete user mutation
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });
}

/**
 * Forgot password mutation
 */
export function useForgotPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (email: string) => usersApi.forgotPassword(email),
    onSuccess: (response) => {
      if (response?.forgotPassword?.success) {
        toast({
          title: "Email Sent",
          description:
            response.forgotPassword.message ||
            "Check your inbox for reset instructions",
        });
      } else {
        // Handle cases where the backend returns success: false
        toast({
          title: "Error",
          description:
            response?.forgotPassword?.message || "Could not process request.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { token: string; newPassword: string }) =>
      usersApi.resetPassword(payload),
    onSuccess: (response) => {
      if (response?.resetPassword?.success) {
        toast({
          title: "Password Updated",
          description:
            response.resetPassword.message ||
            "Your password has been reset successfully.",
        });
        router.push("/login");
      } else {
        toast({
          title: "Reset Failed",
          description:
            response?.resetPassword?.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Request account deletion hook
 */
export function useRequestDeletion() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { email: string; password: string; reason?: string }) =>
      usersApi.requestDeletion(payload),
    onSuccess: (response) => {
      if (response?.requestAccountDeletion?.success) {
        toast({
          title: "Request Submitted",
          description: response.requestAccountDeletion.message || "Your request is pending review",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: response?.requestAccountDeletion?.message || "Could not submit deletion request",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
}

/**
 * Get account deletion requests hook
 */
export function useDeletionRequests({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.users.deletionRequests(page, limit),
    queryFn: async () => {
      const response = await usersApi.getDeletionRequests({ page, limit });
      return response.findAllDeletionRequests;
    },
  });
}

/**
 * Process a deletion request hook (Approve / Reject)
 */
export function useProcessDeletionRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: { id: string; action: string }) =>
      usersApi.processDeletionRequest(payload),
    onSuccess: (response) => {
      if (response?.processDeletionRequest?.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
        toast({
          title: "Success",
          description: response.processDeletionRequest.message || "Request processed successfully",
        });
      } else {
        toast({
          title: "Failed",
          description: response?.processDeletionRequest?.message || "Failed to process request",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message || "Failed to process deletion request",
        variant: "destructive",
      });
    },
  });
}
