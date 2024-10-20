"use client";

import Layout from "@/app/common/Layout";
import InvoiceManagement from "@/components/InvoiceManagement";
import withAdminProtection from "@/app/withAdminProtection";

const InvoicesPage = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Invoice Management</h1>
        <InvoiceManagement />
      </div>
    </Layout>
  );
};

export default withAdminProtection(InvoicesPage);
