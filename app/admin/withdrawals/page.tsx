"use client";

import Layout from "@/app/common/Layout";
import WithdrawalManagement from "@/components/WithdrawalManagement";
import withAdminProtection from "@/app/withAdminProtection";

const WithdrawalsPage = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Withdrawal Management</h1>
        <WithdrawalManagement />
      </div>
    </Layout>
  );
};

export default withAdminProtection(WithdrawalsPage);
