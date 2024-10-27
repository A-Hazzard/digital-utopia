"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Spinner } from "@nextui-org/react";
import { ProfileModalProvider } from "@/context/ProfileModalContext";
import { UserProvider } from "@/context/UserContext";
import Navbar from "@/components/Navbar";
import Panel from "@/components/Panel";
import { User } from "firebase/auth";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        setLoading(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="md" />
      </div>
    ); 
  }

  return (
    <UserProvider>
      <div className={`bg-background flex h-screen`}>
        <div className={`hidden lg:flex flex-col bg-darker p-4 w-64`}>
          <ProfileModalProvider>
            <Panel />
          </ProfileModalProvider>
        </div>
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
