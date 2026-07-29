import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, deleteUser, getCurrentUser, listUsers, setUserStatus, updateUser } from "@/lib/api/users";
import type { UserCreate, UserResponse, UserStatus, UserUpdate } from "@/types/users";

export function useStaffDirectory() {
  return useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreate) => createUser(data),
    onSuccess: (user) => {
      queryClient.setQueryData<UserResponse[]>(["users"], (old = []) => [user, ...old]);
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UserUpdate }) => updateUser(userId, data),
    onSuccess: (user) => {
      queryClient.setQueryData<UserResponse[]>(["users"], (old = []) =>
        old.map((u) => (u.id === user.id ? user : u))
      );
    },
  });
}

export function useSetUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) => setUserStatus(userId, status),
    onSuccess: (user) => {
      queryClient.setQueryData<UserResponse[]>(["users"], (old = []) =>
        old.map((u) => (u.id === user.id ? { ...u, status: user.status } : u))
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: (result) => {
      queryClient.setQueryData<UserResponse[]>(["users"], (old = []) =>
        old.filter((u) => u.id !== result.id)
      );
    },
  });
}
