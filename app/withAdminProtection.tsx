"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Spinner } from "@nextui-org/react";

const withAdminProtection = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  type AdminComponentProps = P;

  type FirebaseUser = {
    email: string | null;
  };

  const AdminProtectedComponent = (props: AdminComponentProps) => {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // Use null to indicate loading state

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
        if (user) {
          setIsAdmin(user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
        } else {
          setIsAdmin(false); // Reset if no user is logged in
        }
      });

      return () => unsubscribe(); // Cleanup subscription on unmount
    }, []);

    useEffect(() => {
      if (isAdmin === false) {
        router.push("/"); // Redirect to home if not admin
      }
    }, [isAdmin, router]);

    // Show a loading state while checking authentication
    if (isAdmin === null) {
      return (
        <div className="bg-background flex items-center justify-center h-screen w-screen">
          <Spinner size="md" />
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  AdminProtectedComponent.displayName = `withAdminProtection(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AdminProtectedComponent;
};

export default withAdminProtection;
