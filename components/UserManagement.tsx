"use client";

import { formatDate } from "@/helpers/date";
import { auth, db } from "@/lib/firebase";
import { Button, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

interface User {
  uid: string;
  createdAt: string;
  email: string;
  displayName: string;
  isDisabled: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserUid(user.uid);
      }
    });

    const usersQuery = query(collection(db, "users"));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        isDisabled: doc.data().isDisabled !== undefined ? doc.data().isDisabled : false, // Ensure isDisabled is set
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, []);

  const handleToggleDisable = async (userId: string, currentStatus: boolean) => {
    console.log(`Toggling status for userId: ${userId}, currentStatus: ${currentStatus}`); // Debug log
    try {
      // Find the user by email instead of userId
      const userToToggle = users.find(user => user.uid === userId);
      if (!userToToggle) {
        toast.error("User does not exist.");
        return; // Exit if the user document does not exist
      }

      const userEmail = userToToggle.email; // Get the user's email

      // Query the user document by email
      const userQuery = query(collection(db, "users"), where("email", "==", userEmail));
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        toast.error("User does not exist.");
        return; // Exit if no user document is found
      }

      const userDoc = querySnapshot.docs[0]; // Get the first document
      const userDocRef = doc(db, "users", userDoc.id); // Reference to the user document

      // Now toggle the status
      await updateDoc(userDocRef, {
        isDisabled: !currentStatus,
      }).then(() => {
        console.log(`User ${currentStatus ? 'enabled' : 'disabled'} successfully`);
      }).catch((error) => {
        console.error(`Error toggling user status: ${error}`);
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        setLoading(true);
        const batch = writeBatch(db);
        const userToDelete = users.find(user => user.uid === userId); // Get the user being deleted

        // Delete user document
        batch.delete(doc(db, "users", userId));

        // Delete user's data from other collections
        const collections = ["users", "invoices", "deposits", "withdrawals", "withdrawalRequests", "wallets"];
        
        for (const collectionName of collections) {
          const q = query(collection(db, collectionName), where("userEmail", "==", userToDelete?.email)); // Check for userEmail
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });

          const q2 = query(collection(db, collectionName), where("email", "==", userToDelete?.email)); // Check for email
          const querySnapshot2 = await getDocs(q2);
          querySnapshot2.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }

        await batch.commit();
        
        setUsers(users.filter(user => user.uid !== userId));
        toast.success("User and associated data deleted successfully");
      } catch (error) {
        console.error("Error deleting user and associated data:", error);
        toast.error("Failed to delete user and associated data");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-4">
        <ToastContainer />
      <h1 className="text-2xl font-bold text-light">User Management</h1>
      <Table aria-label="User management table" className="text-light">
        <TableHeader>
          <TableColumn className="text-dark">Username</TableColumn>
          <TableColumn className="text-dark">Email</TableColumn>
          <TableColumn className="text-dark">Created At</TableColumn>
          <TableColumn className="text-dark">Status</TableColumn>
          <TableColumn className="text-dark">Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {users.filter(user => user.uid !== currentUserUid).map((user) => (
            <TableRow key={user.uid} className="text-light">
              <TableCell className="text-light">{user.displayName}</TableCell>
              <TableCell className="text-light">{user.email}</TableCell>
              <TableCell className="text-light">{formatDate(user.createdAt)}</TableCell>
              <TableCell className="text-light">{user.isDisabled ? 'Disabled' : 'Active'}</TableCell>
              <TableCell className="text-light">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    color={user.isDisabled ? "success" : "warning"}
                    onClick={() => {
                      console.log(`Button clicked for user: ${user.uid}, isDisabled: ${user.isDisabled}`); // Debug log
                      handleToggleDisable(user.uid, user.isDisabled);
                    }}
                    className="text-light"
                  >
                    {user.isDisabled ? 'Enable' : 'Disable'}
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    onClick={() => handleDeleteUser(user.uid)}
                    className="text-light"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;