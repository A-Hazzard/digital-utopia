"use client";

import { formatDate } from "@/helpers/date";
import { auth, db } from "@/lib/firebase";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Pagination,
} from "@nextui-org/react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  orderBy,
  limit,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

type User = {
  uid: string;
  createdAt: string;
  email: string;
  displayName: string;
  isDisabled: boolean;
  isAdmin: boolean;
}

const ITEMS_PER_PAGE = 50;

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMakingAdmin, setIsMakingAdmin] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserUid(user.uid);
      }
    });

    const usersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "desc"),
      limit(ITEMS_PER_PAGE)
    );
    
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        isDisabled:
          doc.data().isDisabled !== undefined ? doc.data().isDisabled : false,
        isAdmin: doc.data().isAdmin !== undefined ? doc.data().isAdmin : false,
      })) as User[];
      setUsers(usersData);
      setTotalPages(Math.ceil(snapshot.size / ITEMS_PER_PAGE));
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, [currentPage]);

  const handleToggleDisable = async (
    userId: string,
    currentStatus: boolean
  ) => {
   
    try {
      const userToToggle = users.find((user) => user.uid === userId);
      if (!userToToggle) {
        toast.error("User does not exist.");
        return;
      }

      const userEmail = userToToggle.email;

      const userQuery = query(
        collection(db, "users"),
        where("email", "==", userEmail)
      );
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        toast.error("User does not exist.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userDocRef = doc(db, "users", userDoc.id);

      await updateDoc(userDocRef, {
        isDisabled: !currentStatus,
      })
        .then(() => {
          console.log(
            `User ${currentStatus ? "enabled" : "disabled"} successfully`
          );
        })
        .catch((error) => {
          console.error(`Error toggling user status: ${error}`);
        });
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        setLoading(true);
        const batch = writeBatch(db);
        const userToDelete = users.find((user) => user.uid === userId);

        if (!userToDelete || !userToDelete.email) {
          throw new Error("User not found or email is missing");
        }

        batch.delete(doc(db, "users", userId));

        const collections = [
          "users",
          "profits",
          "trades",
          "invoices",
          "deposits",
          "withdrawals",
          "withdrawalRequests",
          "wallets",
        ];

        for (const collectionName of collections) {
          const q1 = query(
            collection(db, collectionName),
            where("userEmail", "==", userToDelete.email)
          );
          const querySnapshot1 = await getDocs(q1);
          querySnapshot1.forEach((doc) => {
            batch.delete(doc.ref);
          });

          const q2 = query(
            collection(db, collectionName),
            where("email", "==", userToDelete.email)
          );
          const querySnapshot2 = await getDocs(q2);
          querySnapshot2.forEach((doc) => {
            batch.delete(doc.ref);
          });

          const docRef = doc(db, collectionName, userToDelete.email);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            batch.delete(docRef);
          }
        }

        await batch.commit();

        setUsers(users.filter((user) => user.uid !== userId));
        toast.success("User and associated data deleted successfully");
      } catch (error) {
        console.error("Error deleting user and associated data:", error);
        toast.error("Failed to delete user and associated data");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAdminToggle = async (user: User) => {
    setSelectedUser(user);
    setIsMakingAdmin(!user.isAdmin); 
    setModalVisible(true);
  };

  useEffect(() => {
    console.log("selectedUser", selectedUser);
    console.log("modalVisible", modalVisible);
  }, [selectedUser, modalVisible]);

  const confirmAdminToggle = async () => {
    if (!selectedUser?.email) {
      toast.error("No user selected or email missing");
      return;
    }

    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const userQuery = query(
        usersRef,
        where("email", "==", selectedUser.email)
      );
      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        toast.error("No user found with this email");
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((userDoc) => {
        const userRef = doc(db, "users", userDoc.id);
        batch.update(userRef, { isAdmin: isMakingAdmin });
      });

      await batch.commit();

      setUsers(
        users.map((user) =>
          user.email === selectedUser.email
            ? { ...user, isAdmin: isMakingAdmin }
            : user
        )
      );

      toast.success(
        `User ${isMakingAdmin ? "made" : "removed as"} admin successfully`
      );
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast.error("Failed to update admin status");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
  <ToastContainer />
  
  <div className="bg-darker p-6 rounded-xl border border-readonly/30">
    <h2 className="text-xl font-bold mb-6">User Management</h2>
    <Table 
      aria-label="User management table" 
      className="rounded-lg shadow-md"
      classNames={{
        th: "bg-readonly text-light",
        td: "text-gray"
      }}
    >
      <TableHeader>
        <TableColumn>Username</TableColumn>
        <TableColumn>Email</TableColumn>
        <TableColumn>Created At</TableColumn>
        <TableColumn>Status</TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {users
          .filter((user) => user.uid !== currentUserUid)
          .map((user) => (
            <TableRow key={user.uid}>
              <TableCell className="font-semibold text-light">{user.displayName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.isDisabled 
                    ? 'bg-red-500/20 text-red-500' 
                    : 'bg-green-500/20 text-green-500'
                }`}>
                  {user.isDisabled ? "Disabled" : "Active"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className={user.isDisabled ? "bg-green-500/20 text-green-500" : "bg-orange/20 text-orange"}
                    onClick={() => handleToggleDisable(user.uid, user.isDisabled)}
                  >
                    {user.isDisabled ? "Enable" : "Disable"}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500/20 text-red-500"
                    onClick={() => handleDeleteUser(user.uid)}
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    className={user.isAdmin ? "bg-orange/20 text-orange" : "bg-blue-500/20 text-blue-500"}
                    onClick={() => handleAdminToggle(user)}
                  >
                    {user.isAdmin ? "Remove Admin" : "Make Admin"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  </div>

  <Pagination
    total={totalPages}
    initialPage={1}
    page={currentPage}
    onChange={handlePageChange}
    className="flex justify-center mt-4"
  />

  <Modal
    closeButton
    isOpen={modalVisible}
    onClose={() => setModalVisible(false)}
    classNames={{
      base: "bg-darker border border-readonly/30",
      header: "border-b border-readonly/30",
      body: "text-light py-6",
      footer: "border-t border-readonly/30"
    }}
  >
    <ModalContent>
      <ModalHeader>
        <h2 className="text-xl font-bold">{isMakingAdmin ? "Make Admin" : "Remove Admin"}</h2>
      </ModalHeader>
      <ModalBody>
        <p>Are you sure you want to {isMakingAdmin ? "make" : "remove"} {selectedUser?.displayName} as an admin?</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="light" className="bg-readonly text-gray" onClick={() => setModalVisible(false)}>
          Cancel
        </Button>
        <Button className="bg-orange hover:bg-orange/90" onClick={confirmAdminToggle}>
          Confirm
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
  </div>

  );
};

export default UserManagement;
