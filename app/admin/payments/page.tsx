"use client";

import AdminLayout from "@/app/common/AdminLayout";
import PaymentManagement from "@/components/PaymentManagement";

const PaymentsPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Payment Management</h1>
        <PaymentManagement />
      </div>
    </AdminLayout>
  );
};

export default PaymentsPage;
