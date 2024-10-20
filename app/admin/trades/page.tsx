"use client";

import Layout from "@/app/common/Layout";
import TradeResultsManagement from "@/components/TradeResultsManagement";
import withAdminProtection from "@/app/withAdminProtection";

const TradesPage = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Trade Results Management</h1>
        <TradeResultsManagement />
      </div>
    </Layout>
  );
};

export default withAdminProtection(TradesPage);
