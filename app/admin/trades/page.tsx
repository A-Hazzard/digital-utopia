"use client";

import AdminLayout from "@/app/common/AdminLayout";
import TradeResultsManagement from "@/components/TradeResultsManagement";

const TradesPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Trade Results Management</h1>
        <TradeResultsManagement />
      </div>
    </AdminLayout>
  );
};

export default TradesPage;
