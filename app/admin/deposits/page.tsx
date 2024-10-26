"use client";

import AdminLayout from "@/app/common/AdminLayout";
import DepositManagement from "@/components/DepositManagement";

const DepositsPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Deposit Management</h1>
        <DepositManagement />
      </div>
    </AdminLayout>
  );
};

export default DepositsPage;
