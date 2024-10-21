import React, { createContext, useContext, useState } from "react";

interface User {
  email: string; // Add other user properties as needed
}

const UserContext = createContext<{
  user: User | null; // User can be null if not logged in
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  avatar: string | null;
  setAvatar: React.Dispatch<React.SetStateAction<string | null>>;
} | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Initialize user state
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser, username, setUsername, avatar, setAvatar }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
