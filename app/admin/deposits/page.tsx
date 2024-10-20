"use client";

import Layout from "@/app/common/Layout";
import DepositManagement from "@/components/DepositManagement";
import withAdminProtection from "@/app/withAdminProtection";

const DepositsPage = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Deposit Management</h1>
        <DepositManagement />
      </div>
    </Layout>
  );
};

export default withAdminProtection(DepositsPage);
