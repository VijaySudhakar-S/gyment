const TOKEN_KEY = 'gyment_token';
const REFRESH_TOKEN_KEY = 'gyment_refreshtoken';
const USER_KEY = 'gyment_user';

export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=28800`;
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUser: <T = any>(): T | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setUser: (user: unknown): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setSession: (params: { token: string; refreshToken?: string; user?: unknown }): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, params.token);
    // Sync cookie for Next.js middleware protection
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(params.token)}; path=/; SameSite=Lax; max-age=28800`;

    if (params.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, params.refreshToken);
    }
    if (params.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(params.user));
    }
  },

  clearSession: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear cookies
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0`;
  },
};

export default tokenStorage;
