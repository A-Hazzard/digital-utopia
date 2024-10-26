"use client";

import AdminLayout from "@/app/common/AdminLayout";
import InvoiceManagement from "@/components/InvoiceManagement";

const InvoicesPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Invoice Management</h1>
        <InvoiceManagement />
      </div>
    </AdminLayout>
  );
};

export default InvoicesPage;