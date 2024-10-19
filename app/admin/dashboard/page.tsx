"use client";

import { useEffect, useState } from "react";
import Layout from "@/app/common/Layout";
import InvoiceManagement from "@/components/InvoiceManagement";
import DepositManagement from "@/components/DepositManagement";
import WithdrawalManagement from "@/components/WithdrawalManagement";
import PaymentManagement from "@/components/PaymentManagement";
import TradeResultsManagement from "@/components/TradeResultsManagement";
import ResourcesManagement from "@/components/ResourcesManagement";

const AdminDashboard = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Admin Dashboard</h1>
        <InvoiceManagement />
        <DepositManagement />
        <WithdrawalManagement />
        <PaymentManagement />
        <TradeResultsManagement />
        <ResourcesManagement />
      </div>
    </Layout>
  );
};

export default AdminDashboard;
