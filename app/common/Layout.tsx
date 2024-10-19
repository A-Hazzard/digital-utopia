"use client";

import { ProfileModalProvider } from "@/context/ProfileModalContext";
import Navbar from "@/components/Navbar";
import Panel from "@/components/Panel";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={`bg-background flex h-screen`}>
      {/* Left Panel for Desktop */}
      <div className={`hidden lg:flex flex-col bg-darker p-4 w-64`}>
        <ProfileModalProvider>
          <Panel />
        </ProfileModalProvider>
      </div>

      {/* Mobile Navbar */}
      <ProfileModalProvider>
        <Navbar />
      </ProfileModalProvider>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col gap-4 pt-10 px-10 lg:p-8 overflow-y-auto`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
