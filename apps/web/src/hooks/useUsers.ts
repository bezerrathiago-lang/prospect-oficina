/**
 * Hooks TanStack Query para usuários (admin).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers, createUser, type CreateUserData } from '../services/users.service.js';

const USERS_KEY = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => listUsers(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserData) => createUser(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
