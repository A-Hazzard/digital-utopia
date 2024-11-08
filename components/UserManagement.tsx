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
  Card,
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isMakingAdmin, setIsMakingAdmin] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [totalProfit, setTotalProfit] = useState<number | null>(null);
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [isConfirmingAdminToggle, setIsConfirmingAdminToggle] = useState(false);

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

  const handleAdminToggle = async (user: User) => {
    setSelectedUser(user);
    setIsMakingAdmin(!user.isAdmin); 
    setIsConfirmingAdminToggle(true);
  };

  useEffect(() => {
    console.log("selectedUser", selectedUser);
  }, [selectedUser, isConfirmingAdminToggle]);

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
      setIsConfirmingAdminToggle(false);
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

  const fetchUserFinancials = async (email: string) => {
    try {
      const walletDocRef = doc(db, "wallets", email);
      const walletDoc = await getDoc(walletDocRef);
      const profitDocRef = doc(db, "profits", email);
      const profitDoc = await getDoc(profitDocRef);

      if (walletDoc.exists()) {
        setWalletBalance(walletDoc.data()?.balance);
      } else {
        setWalletBalance(null);
      }

      if (profitDoc.exists()) {
        setTotalProfit(profitDoc.data()?.profit);
      } else {
        setTotalProfit(null);
      }
    } catch (error) {
      console.error("Error fetching user financials:", error);
    }
  };

  const handleUserClick = (user: User) => {
    fetchUserFinancials(user.email);
    setBalanceModalVisible(true);
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
                  <TableCell 
                    className="font-semibold text-light cursor-pointer" 
                    onClick={() => handleUserClick(user)}
                  >
                    {user.displayName}
                  </TableCell>
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
        isOpen={isConfirmingAdminToggle}
        onClose={() => setIsConfirmingAdminToggle(false)}
        classNames={{
          base: "bg-darker border border-readonly/30",
          header: "border-b border-readonly/30",
          body: "text-light py-6",
          footer: "border-t border-readonly/30"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">Confirm Admin Toggle</h2>
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to {isMakingAdmin ? "make" : "remove"} {selectedUser?.displayName} as an admin?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" className="bg-readonly text-gray" onClick={() => setIsConfirmingAdminToggle(false)}>
              Cancel
            </Button>
            <Button variant="solid" onClick={confirmAdminToggle}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        closeButton
        isOpen={balanceModalVisible}
        onClose={() => setBalanceModalVisible(false)}
        classNames={{
          base: "bg-darker border border-readonly/30",
          header: "border-b border-readonly/30",
          body: "text-light py-6",
          footer: "border-t border-readonly/30"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl text-light font-bold">User Finances</h2>
          </ModalHeader>
          <ModalBody>
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-semibold">Wallet Balance</h3>
              <p>{walletBalance !== null ? `$${walletBalance.toFixed(2)}` : "Not Deposit Has Been Made"}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-lg font-semibold">Total Profits</h3>
              <p>{totalProfit !== null ? `$${totalProfit.toFixed(2)}` : "Not Profit Has Been Made"}</p>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" className="bg-readonly text-gray" onClick={() => setBalanceModalVisible(false)}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default UserManagement;
