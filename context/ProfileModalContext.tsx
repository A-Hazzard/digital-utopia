import React, { createContext, useContext, useState } from "react";

const ProfileModalContext = createContext({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export const useProfileModal = () => useContext(ProfileModalContext);

export const ProfileModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  return (
    <ProfileModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ProfileModalContext.Provider>
  );
};
