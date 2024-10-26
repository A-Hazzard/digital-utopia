"use client";

import Navbar from "@/components/Navbar";
import Panel from "@/components/Panel";
import { ProfileModalProvider } from "@/context/ProfileModalContext";
import { UserProvider } from "@/context/UserContext";
import { auth, db } from "@/lib/firebase";
import { Spinner } from "@nextui-org/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          if (userDoc.data().isAdmin) {
            setLoading(false);
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
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
          {children} {/* Render children only when not loading */}
        </main>
      </div>
    </UserProvider>
  );
};

export default AdminLayout;
