"use client";

import AdminLayout from "@/app/common/AdminLayout";
import UserManagement from "@/components/UserManagement";

const UserManagementPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <h1 className="text-2xl text-light font-bold mb-4">User Management</h1>
        <UserManagement />
      </div>
    </AdminLayout>
  );
};

export default UserManagementPage;
