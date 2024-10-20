"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const withAdminProtection = (WrappedComponent: React.ComponentType) => {
  const AdminProtectedComponent = (props: React.ComponentProps<typeof WrappedComponent>) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/");
        return;
      }

      if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) router.push("/");

      setLoading(false);
    }, [router]);

    if (loading) return null; 
    

    return <WrappedComponent {...props} />;
  };

  return AdminProtectedComponent;
};

export default withAdminProtection;
