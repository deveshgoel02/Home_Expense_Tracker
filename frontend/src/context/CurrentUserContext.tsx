import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../lib/api";
import type { User } from "../types";

const STORAGE_KEY = "family-expense-tracker:current-user-id";

interface CurrentUserContextValue {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  setCurrentUserId: (id: string | null) => void;
}

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: () => usersApi.list() });
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (currentUserId && !isLoading && !users.some((u) => u.id === currentUserId)) {
      setCurrentUserIdState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentUserId, users, isLoading]);

  const setCurrentUserId = (id: string | null) => {
    setCurrentUserIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const currentUser = users.find((u) => u.id === currentUserId) ?? null;

  return (
    <CurrentUserContext.Provider value={{ currentUser, users, isLoading, setCurrentUserId }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
