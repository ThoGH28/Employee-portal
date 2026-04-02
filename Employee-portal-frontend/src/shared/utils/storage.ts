// Storage keys
const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

// Token management
export const setTokenToStorage = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getTokenFromStorage = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const removeTokenFromStorage = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setRefreshTokenToStorage = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshTokenFromStorage = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// User management
export const setUserToStorage = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserFromStorage = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUserFromStorage = (): void => {
  localStorage.removeItem(USER_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getTokenFromStorage();
};

// Clear all storage
export const clearStorage = (): void => {
  removeTokenFromStorage();
};
