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

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMakingAdmin, setIsMakingAdmin] = useState(true);

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
        isDisabled:
          doc.data().isDisabled !== undefined ? doc.data().isDisabled : false,
        isAdmin: doc.data().isAdmin !== undefined ? doc.data().isAdmin : false,
      })) as User[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, []);

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

  if (loading) {
    return <Spinner size="lg" />;
  }

  return (
    <div className="space-y-4">
      <ToastContainer />
      <Modal
        closeButton
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
      >
        <ModalContent>
          <ModalHeader>
            <h2>{isMakingAdmin ? "Make Admin" : "Remove Admin"}</h2>
          </ModalHeader>
          <ModalBody>
            <p className="text-light">Are you sure you want to {isMakingAdmin ? "make" : "remove"} {selectedUser?.displayName} as an admin?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" color="warning" onClick={() => setModalVisible(false)}>
              No
            </Button>
            <Button color="primary" onClick={confirmAdminToggle}>
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Table aria-label="User management table" className="text-light">
        <TableHeader>
          <TableColumn className="text-dark">Username</TableColumn>
          <TableColumn className="text-dark">Email</TableColumn>
          <TableColumn className="text-dark">Created At</TableColumn>
          <TableColumn className="text-dark">Status</TableColumn>
          <TableColumn className="text-dark">Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {users
            .filter((user) => user.uid !== currentUserUid)
            .map((user) => (
              <TableRow key={user.uid} className="text-light">
                <TableCell className="text-light">{user.displayName}</TableCell>
                <TableCell className="text-light">{user.email}</TableCell>
                <TableCell className="text-light">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-light">
                  {user.isDisabled ? "Disabled" : "Active"}
                </TableCell>
                <TableCell className="text-light">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      color={user.isDisabled ? "success" : "warning"}
                      onClick={() => handleToggleDisable(user.uid, user.isDisabled)}
                      className="text-light"
                    >
                      {user.isDisabled ? "Enable" : "Disable"}
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={() => handleDeleteUser(user.uid)}
                      className="text-light"
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      color={user.isAdmin ? "warning" : "primary"}
                      onClick={() => handleAdminToggle(user)}
                      className="text-light"
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
  );
};

export default UserManagement;
