"use client";

import Layout from "@/app/common/Layout";
import PaymentManagement from "@/components/PaymentManagement";
import withAdminProtection from "@/app/withAdminProtection";

const PaymentsPage = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Payment Management</h1>
        <PaymentManagement />
      </div>
    </Layout>
  );
};

export default withAdminProtection(PaymentsPage);
