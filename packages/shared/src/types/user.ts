export type UserRole = 'consultant' | 'manager';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
