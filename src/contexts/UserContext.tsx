"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try {
        setCurrentUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
