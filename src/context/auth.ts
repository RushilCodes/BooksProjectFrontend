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

export const API_URL = 'https://world-library-backend.rushilcodes.workers.dev';

export const OAUTH_CONFIG = {
  google: {
    clientId: '219846217201-jcmpoagno696q74nljvhkmici0grgg8v.apps.googleusercontent.com',
    redirectUri: 'https://world-library-frontend.pages.dev/auth/google/callback',
    scope: 'openid email profile',
  },
  microsoft: {
    clientId: '8a3ad757-94b9-46bd-aa08-7726e9df30c5', 
    redirectUri: 'https://world-library-frontend.pages.dev/auth/microsoft/callback',
    scope: 'openid email profile User.Read',
  },
};
