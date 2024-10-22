"use client";

import Layout from "@/app/common/Layout";
import { formatDate } from "@/helpers/date";
import { db } from "@/lib/firebase";
import {
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  startAfter,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Withdrawal {
  id: string;
  userEmail: string;
  username: string; // Keep this in the interface for data consistency
  amount: number;
  date: Timestamp;
  status: "pending" | "confirmed";
}

interface WithdrawalRequest {
  id: string;
  userEmail: string;
  username: string; // Keep this in the interface for data consistency
  amount: number;
  date: Timestamp;
  status: "pending" | "confirmed";
  address: string;
}

const ITEMS_PER_PAGE = 50;

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWithdrawalPage, setCurrentWithdrawalPage] = useState(1);
  const [currentRequestPage, setCurrentRequestPage] = useState(1);
  const [totalWithdrawalPages, setTotalWithdrawalPages] = useState(0);
  const [totalRequestPages, setTotalRequestPages] = useState(0);
  const [lastVisibleWithdrawal, setLastVisibleWithdrawal] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastVisibleRequest, setLastVisibleRequest] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [newWithdrawal, setNewWithdrawal] = useState<
    Omit<Withdrawal, "id" | "username">
  >({
    userEmail: "",
    amount: 0,
    date: Timestamp.now(),
    status: "pending",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const unsubscribeWithdrawals = listenToWithdrawals();
    const unsubscribeWithdrawalRequests = listenToWithdrawalRequests();

    return () => {
      unsubscribeWithdrawals();
      unsubscribeWithdrawalRequests();
    };
  }, []);

  const listenToWithdrawals = () => {
    const withdrawalsCollection = collection(db, "withdrawals");
    const q = query(
      withdrawalsCollection,
      orderBy("date", "desc"),
      limit(ITEMS_PER_PAGE)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const withdrawalsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Withdrawal[];
        setWithdrawals(withdrawalsData);
        setLastVisibleWithdrawal(snapshot.docs[snapshot.docs.length - 1]);
        setTotalWithdrawalPages(Math.ceil(snapshot.size / ITEMS_PER_PAGE));
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching withdrawals:", err);
        setError("Failed to fetch withdrawals");
        setLoading(false);
      }
    );
  };

  const listenToWithdrawalRequests = () => {
    const withdrawalRequestsCollection = collection(db, "withdrawalRequests");
    const q = query(
      withdrawalRequestsCollection,
      orderBy("date", "desc"),
      limit(ITEMS_PER_PAGE)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const withdrawalRequestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WithdrawalRequest[];
        setWithdrawalRequests(withdrawalRequestsData);
        setLastVisibleRequest(snapshot.docs[snapshot.docs.length - 1]);
        setTotalRequestPages(Math.ceil(snapshot.size / ITEMS_PER_PAGE));
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching withdrawal requests:", err);
        setError("Failed to fetch withdrawal requests");
        setLoading(false);
      }
    );
  };

  const handleWithdrawalPageChange = (page: number) => {
    setCurrentWithdrawalPage(page);
    if (page > currentWithdrawalPage && lastVisibleWithdrawal) {
      fetchMoreWithdrawals(lastVisibleWithdrawal);
    }
  };

  const handleRequestPageChange = (page: number) => {
    setCurrentRequestPage(page);
    if (page > currentRequestPage && lastVisibleRequest) {
      fetchMoreWithdrawalRequests(lastVisibleRequest);
    }
  };

  const fetchMoreWithdrawals = async (lastDoc: QueryDocumentSnapshot<DocumentData>) => {
    const withdrawalsCollection = collection(db, "withdrawals");
    const q = query(
      withdrawalsCollection,
      orderBy("date", "desc"),
      startAfter(lastDoc),
      limit(ITEMS_PER_PAGE)
    );

    const snapshot = await onSnapshot(q, (snapshot) => {
      const newWithdrawals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Withdrawal[];
      setWithdrawals((prev) => [...prev, ...newWithdrawals]);
      setLastVisibleWithdrawal(snapshot.docs[snapshot.docs.length - 1]);
    });

    return () => snapshot();
  };

  const fetchMoreWithdrawalRequests = async (lastDoc: QueryDocumentSnapshot<DocumentData>) => {
    const withdrawalRequestsCollection = collection(db, "withdrawalRequests");
    const q = query(
      withdrawalRequestsCollection,
      orderBy("date", "desc"),
      startAfter(lastDoc),
      limit(ITEMS_PER_PAGE)
    );

    const snapshot = await onSnapshot(q, (snapshot) => {
      const newWithdrawalRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as WithdrawalRequest[];
      setWithdrawalRequests((prev) => [...prev, ...newWithdrawalRequests]);
      setLastVisibleRequest(snapshot.docs[snapshot.docs.length - 1]);
    });

    return () => snapshot();
  };

  const handleEmailChange = async (email: string) => {
    setNewWithdrawal({ ...newWithdrawal, userEmail: email });

    // Fetch username based on email
    const userDoc = await getUserByEmail(email);
    if (userDoc) {
      setUsername(userDoc.username); // Assuming userDoc has a username field
    } else {
      setUsername(""); // Reset if no user found
    }
  };

  const getUserByEmail = async (email: string) => {
    const usersCollection = collection(db, "users"); // Adjust the collection name as needed
    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? snapshot.docs[0].data() : null;
  };

  const handleAddWithdrawal = async () => {
    try {
      const formattedWithdrawal = {
        ...newWithdrawal,
        username: username, // Set the username from the fetched data
        date: Timestamp.fromDate(selectedDate),
        amount: Number(newWithdrawal.amount),
      };

      await addDoc(collection(db, "withdrawals"), formattedWithdrawal);

      // Send confirmation email
      const emailResponse = await fetch("/api/sendClientWithdrawalEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: newWithdrawal.userEmail,
          amount: formattedWithdrawal.amount.toString(),
          date: selectedDate.toISOString().split("T")[0],
        }),
      });

      if (emailResponse.ok) {
        toast.success("Withdrawal added and confirmation email sent!");
      } else {
        toast.error("Withdrawal added, but failed to send confirmation email.");
      }

      setNewWithdrawal({
        userEmail: "",
        amount: 0,
        date: Timestamp.now(),
        status: "pending",
      });
      setSelectedDate(new Date());
      setUsername(""); // Reset username after submission
    } catch (err) {
      console.error("Error adding withdrawal:", err);
      setError("Failed to add withdrawal");
      toast.error("Failed to add withdrawal.");
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: "pending" | "confirmed",
    isRequest: boolean = false
  ) => {
    try {
      const collectionName = isRequest ? "withdrawalRequests" : "withdrawals";
      const docRef = doc(db, collectionName, id);

      await runTransaction(db, async (transaction) => {
        const withdrawalDoc = await transaction.get(docRef);
        if (!withdrawalDoc.exists()) {
          throw new Error("Withdrawal document does not exist!");
        }

        const withdrawalData = withdrawalDoc.data();
        const userEmail = withdrawalData.userEmail;
        const amount = withdrawalData.amount;

        if (isRequest && newStatus === "confirmed") {
          const walletRef = doc(db, "wallets", userEmail);
          const walletDoc = await transaction.get(walletRef);

          if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            if (currentBalance < amount) {
              throw new Error("Insufficient funds in wallet");
            }
            transaction.update(walletRef, { balance: currentBalance - amount });
          } else {
            throw new Error("Wallet does not exist");
          }

          transaction.set(doc(db, "withdrawals", id), {
            ...withdrawalData,
            status: "confirmed",
          });
        }

        transaction.update(docRef, { status: newStatus });
      });
    } catch (err) {
      console.error("Error updating status:", err);
      setError(
        `Failed to update ${
          isRequest ? "withdrawal request" : "withdrawal"
        } status`
      );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Layout>
      <ToastContainer />
      {/* Add Withdrawal Form */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2 text-light">
          Add New Withdrawal
        </h2>
        <div className="flex flex-wrap gap-4">
          <Input
            type="email"
            placeholder="User Email"
            value={newWithdrawal.userEmail}
            onChange={(e) => handleEmailChange(e.target.value)} // Update email change handler
          />
          <Input
            type="text"
            placeholder="Amount"
            value={newWithdrawal.amount.toString()}
            onChange={(e) =>
              setNewWithdrawal({
                ...newWithdrawal,
                amount: Number(e.target.value),
              })
            }
          />
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border rounded-md bg-transparent text-white"
          />
          <Select
            placeholder="Status"
            value={newWithdrawal.status}
            onChange={(e) =>
              setNewWithdrawal({
                ...newWithdrawal,
                status: e.target.value as "pending" | "confirmed",
              })
            }
          >
            <SelectItem key="pending" value="pending">
              Pending
            </SelectItem>
            <SelectItem key="confirmed" value="confirmed">
              Confirmed
            </SelectItem>
          </Select>
          <Button
            onClick={handleAddWithdrawal}
            disabled={!newWithdrawal.userEmail || newWithdrawal.amount <= 0} // Disable if inputs are not valid
          >
            Add Withdrawal
          </Button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <h3 className="text-xl font-bold mb-2 text-light">Withdrawals</h3>
      <Table
        aria-label="Withdrawals Table"
        className="mb-8 text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>Email</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal.id}>
              <TableCell>{withdrawal.userEmail}</TableCell>
              <TableCell>{withdrawal.amount}</TableCell>
              <TableCell>{formatDate(withdrawal.date)}</TableCell>
              <TableCell>{withdrawal.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        total={totalWithdrawalPages}
        initialPage={1}
        page={currentWithdrawalPage}
        onChange={handleWithdrawalPageChange}
        className="mt-4"
      />

      {/* Withdrawal Requests Table */}
      <h3 className="text-xl font-bold mb-2 text-light">Withdrawal Requests</h3>
      <Table
        aria-label="Withdrawal Requests Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>Username</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Address</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {withdrawalRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.username || "N/A"}</TableCell>
              <TableCell>{request.userEmail}</TableCell>
              <TableCell>{request.amount}</TableCell>
              <TableCell>{formatDate(request.date)}</TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell>{request.address}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color={request.status === "pending" ? "primary" : "success"}
                  onClick={() =>
                    handleUpdateStatus(
                      request.id,
                      request.status === "pending" ? "confirmed" : "pending",
                      true
                    )
                  }
                >
                  {request.status === "pending"
                    ? "Confirm"
                    : "Revert to Pending"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        total={totalRequestPages}
        initialPage={1}
        page={currentRequestPage}
        onChange={handleRequestPageChange}
        className="mt-4"
      />
    </Layout>
  );
};

export default WithdrawalManagement;
