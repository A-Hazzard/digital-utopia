"use client";

import AdminLayout from "@/app/common/AdminLayout";
import WithdrawalManagement from "@/components/WithdrawalManagement";

const WithdrawalsPage = () => {
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
