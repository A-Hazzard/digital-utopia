"use client";

import AdminLayout from "@/app/common/AdminLayout";
import withAdminProtection from "@/app/withAdminProtection";
import UserManagement from "@/components/UserManagement";

const UserManagementPage = () => {
  return (
    <AdminLayout>
      <div className="p-4">
        <UserManagement />
      </div>
    </AdminLayout>
  );
};

export default withAdminProtection(UserManagementPage);
