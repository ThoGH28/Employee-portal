import { create } from "zustand";
import type { User } from "../types";
import {
  setUserToStorage,
  removeUserFromStorage,
  getUserFromStorage,
  getTokenFromStorage,
} from "../utils/storage";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  loadUserFromStorage: () => void;
  refreshUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    if (user) {
      setUserToStorage(user);
    } else {
      removeUserFromStorage();
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  logout: () => {
    set({ user: null, isAuthenticated: false });
    removeUserFromStorage();
  },

  loadUserFromStorage: () => {
    const user = getUserFromStorage();
    set({ user, isAuthenticated: !!user });
    // If user data is stale (missing department), refresh from API
    if (user && !user.department && getTokenFromStorage()) {
      useAuthStore.getState().refreshUserProfile();
    }
  },

  refreshUserProfile: async () => {
    try {
      const { authService } = await import("../services/authService");
      const response = await authService.getCurrentUser();
      const freshUser = response.data as User;
      set({ user: freshUser, isAuthenticated: true });
      setUserToStorage(freshUser);
    } catch {
      // Silently fail — user can still use the app, just missing department
    }
  },
}));

interface ChatStore {
  currentConversationId: string | null;
  isLoading: boolean;
  setCurrentConversation: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentConversationId: null,
  isLoading: false,

  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
