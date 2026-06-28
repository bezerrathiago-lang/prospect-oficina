/**
 * Hooks TanStack Query para lojas.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStores,
  createStore,
  updateStore,
  type CreateStoreData,
  type UpdateStoreData,
} from '../services/stores.service.js';

const STORES_KEY = ['stores'] as const;

export function useStores(includeInactive = false) {
  return useQuery({
    queryKey: [...STORES_KEY, { includeInactive }],
    queryFn: () => getStores(includeInactive),
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoreData) => createStore(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STORES_KEY });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStoreData }) => updateStore(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STORES_KEY });
    },
  });
}
