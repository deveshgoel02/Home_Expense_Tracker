import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, setUnauthorizedHandler } from "../lib/api";
import type { User } from "../types";

interface CurrentUserContextValue {
  currentUser: User | null;
  isLoading: boolean;
  login: (name: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [loggedOut, setLoggedOut] = useState(false);

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    retry: false,
    enabled: !loggedOut,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.setQueryData(["auth", "me"], null);
      setLoggedOut(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  async function login(name: string, password: string) {
    const user = await authApi.login(name, password);
    setLoggedOut(false);
    queryClient.setQueryData(["auth", "me"], user);
    return user;
  }

  async function logout() {
    await authApi.logout();
    setLoggedOut(true);
    queryClient.setQueryData(["auth", "me"], null);
    queryClient.clear();
  }

  return (
    <CurrentUserContext.Provider value={{ currentUser: currentUser ?? null, isLoading: loggedOut ? false : isLoading, login, logout }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
