export interface HealthResponse {
  status: 'ok';
  db: 'connected' | 'error';
  timestamp: string;
}
