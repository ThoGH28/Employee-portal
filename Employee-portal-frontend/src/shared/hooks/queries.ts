import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { authService } from "../services/authService";
import { useAuthStore } from "../context/store";
import { apiClient } from "../services/api";
import {
  employeeService,
  leaveService,
  announcementService,
} from "../services/employeeService";
import type { User, Employee, LeaveRequest } from "../types";

// Auth hooks
export const useCurrentUser = (): UseQueryResult<User> => {
  return useQuery({
    queryKey: ["user", "current"],
    queryFn: () => authService.getCurrentUser().then((res) => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

export const useLogin = (): UseMutationResult<any, Error, any> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      queryClient.setQueryData(["user", "current"], response.data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
    onSettled: () => {
      // Always clear local state, even if backend call fails
      const { logout } = useAuthStore.getState();
      logout();
      apiClient.clearToken();
      queryClient.clear();
    },
  });
};

// Employee hooks
export const useEmployeeProfile = (): UseQueryResult<Employee> => {
  return useQuery({
    queryKey: ["employee", "profile"],
    queryFn: () => employeeService.getProfile().then((res) => res.data),
    staleTime: 1000 * 60 * 10,
  });
};

export const useListEmployees = (page = 1, limit = 20): UseQueryResult<any> => {
  return useQuery({
    queryKey: ["employees", page, limit],
    queryFn: () =>
      employeeService.listEmployees(page, limit).then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });
};

// Leave hooks
export const useMyLeaveRequests = (): UseQueryResult<LeaveRequest[]> => {
  return useQuery({
    queryKey: ["leaves", "my-requests"],
    queryFn: () => leaveService.getMyLeaveRequests().then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateLeaveRequest = (): UseMutationResult<any, Error, any> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveService.createLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
};

export const useLeaveBalance = (): UseQueryResult<any> => {
  return useQuery({
    queryKey: ["leaves", "balance"],
    queryFn: () => leaveService.getLeaveBalance().then((res) => res.data),
    staleTime: 1000 * 60 * 10,
  });
};

// Announcement hooks
export const useAnnouncements = (page = 1, limit = 10): UseQueryResult<any> => {
  return useQuery({
    queryKey: ["announcements", page, limit],
    queryFn: () =>
      announcementService
        .listAnnouncements(page, limit)
        .then((res) => res.data),
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateAnnouncement = (): UseMutationResult<any, Error, any> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: announcementService.createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
};

export const useAdminUpdateEmployee = (): UseMutationResult<
  any,
  Error,
  { id: string; data: Record<string, any> }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => employeeService.adminUpdateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};
