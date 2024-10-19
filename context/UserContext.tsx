import React, { createContext, useContext, useState } from "react";

const UserContext = createContext<{
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  avatar: string | null;
  setAvatar: React.Dispatch<React.SetStateAction<string | null>>;
} | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  return (
    <UserContext.Provider value={{ username, setUsername, avatar, setAvatar }}>
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
