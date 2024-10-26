"use client";

import AdminLayout from "@/app/common/AdminLayout";
import ResourcesManagement from "@/components/ResourcesManagement";

const ManageResourcesPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">Manage Trading Resources</h1>
        <ResourcesManagement />
      </div>
    </AdminLayout>
  );
};

export default ManageResourcesPage;
