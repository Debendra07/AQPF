import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "manager";
}

interface AuthState {
  user: User | null;
  token: string | null;

  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => {
        set({
          user,
          token,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
        });

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("aqpf-auth");
        }
      },
    }),
    {
      name: "aqpf-auth",
      storage: createJSONStorage(() => localStorage),

      // Only persist authentication data
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);