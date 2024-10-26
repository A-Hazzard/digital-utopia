"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/app/common/AdminLayout";
import WithdrawalManagement from "@/components/WithdrawalManagement";
import { auth } from "@/lib/firebase";
import { Spinner } from "@nextui-org/react";

const WithdrawalsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAdmin(
          user.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL1 ||
            user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL2 ||
            user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL3)
        );
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

  if (isAdmin === false) {
    router.push("/");
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Withdrawal Management</h1>
        <WithdrawalManagement />
      </div>
    </AdminLayout>
  );
};

export default WithdrawalsPage;
