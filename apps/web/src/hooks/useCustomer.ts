/**
 * Hooks TanStack Query para clientes — Story 5.1
 */
import { useQuery } from '@tanstack/react-query';
import {
  getCustomer,
  searchCustomers,
  type CustomerDetail,
  type CustomerSummary,
} from '../services/customers.service.js';

// ── Queries ──────────────────────────────────────────────────────

/**
 * Hook para buscar perfil completo de um cliente por ID.
 */
export function useCustomer(id: number) {
  return useQuery<CustomerDetail>({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: id > 0,
  });
}

/**
 * Hook para buscar clientes por nome ou telefone.
 * Habilitado apenas quando q.length >= 2.
 */
export function useCustomerSearch(q: string) {
  return useQuery<CustomerSummary[]>({
    queryKey: ['customers', 'search', q],
    queryFn: () => searchCustomers(q),
    enabled: q.length >= 2,
    staleTime: 30 * 1000, // 30s — busca é dinâmica, cache curto
  });
}
