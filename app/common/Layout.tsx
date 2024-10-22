"use client";

import { ProfileModalProvider } from "@/context/ProfileModalContext";
import { UserProvider } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import Panel from "@/components/Panel";
import { usePathname } from "next/navigation";
  
const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <UserProvider>
      <div className={`bg-background flex h-screen`}>
        {!isAdminPage && (
          <div className={`hidden lg:flex flex-col bg-darker p-4 w-64`}>
            <ProfileModalProvider>
              <Panel />
            </ProfileModalProvider>
          </div>
        )}
        <ProfileModalProvider>
          <Navbar />
        </ProfileModalProvider>
        <main className={`flex-1 flex flex-col gap-4 pt-10 px-10 lg:p-8 overflow-y-auto`}>
          {children}
        </main>
      </div>
    </UserProvider>
  );
};

export default Layout;
