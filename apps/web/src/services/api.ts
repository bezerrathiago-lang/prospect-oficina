/**
 * Cliente HTTP axios — instância base configurada para a API ProspectMoto
 *
 * Interceptors:
 *   - Request: injeta Authorization: Bearer <token> se token existir no authStore
 *   - Response: em 401, tenta POST /auth/refresh uma vez; se falhar, faz logout
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // envia cookie refreshToken automaticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ─────────────────────────────────────────
// Adiciona Bearer token se existir no localStorage (via authStore persist)
api.interceptors.request.use((config) => {
  // Lê token diretamente do localStorage para evitar dependência circular
  // (authStore importa api, api não pode importar authStore)
  const persisted = localStorage.getItem('auth-storage');
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // localStorage corrompido — ignora silenciosamente
    }
  }
  return config;
});

// ── Response Interceptor ────────────────────────────────────────
// Em 401: tenta renovar via refresh token uma vez antes de forçar logout
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // Só tenta refresh em 401 e se não for já uma retentativa
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Não tenta refresh na própria rota de login/refresh (evita loop)
    const url: string = originalRequest.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Enfileira requisições enquanto o refresh está em curso
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await api.post<{ accessToken: string }>(
        '/api/v1/auth/refresh',
      );
      const newToken = response.data.accessToken;

      // Atualiza token no localStorage para o próximo interceptor de request
      const persisted = localStorage.getItem('auth-storage');
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted) as {
            state?: { token?: string };
          };
          if (parsed?.state) {
            parsed.state.token = newToken;
            localStorage.setItem('auth-storage', JSON.stringify(parsed));
          }
        } catch {
          // ignora
        }
      }

      processQueue(null, newToken);
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh falhou — limpa sessão local e redireciona para login
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
