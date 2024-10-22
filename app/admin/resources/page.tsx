"use client";

import AdminLayout from "@/app/common/AdminLayout";
import ResourcesManagement from "@/components/ResourcesManagement";
import withAdminProtection from "@/app/withAdminProtection";

const ResourcesPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Resources Management</h1>
        <ResourcesManagement />
      </div>
    </AdminLayout>
  );
};

export default withAdminProtection(ResourcesPage);
