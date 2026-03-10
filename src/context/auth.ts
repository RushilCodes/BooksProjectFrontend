import { createContextId, type Signal } from '@builder.io/qwik';

export interface User {
  id: string;
  email?: string;
  name: string;
  phone?: string;
  provider: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export const AuthContext = createContextId<Signal<AuthState>>('auth-context');

export const API_URL = 'https://world-library-backend.rushibajracharya.workers.dev';
