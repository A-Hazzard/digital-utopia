"use client";

import Layout from "@/app/common/Layout";
import ResourcesManagement from "@/components/ResourcesManagement";
import withAdminProtection from "@/app/withAdminProtection";

const ResourcesPage = () => {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Resources Management</h1>
        <ResourcesManagement />
      </div>
    </Layout>
  );
};

export default withAdminProtection(ResourcesPage);
