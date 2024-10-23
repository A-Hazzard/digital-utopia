"use client";

import Layout from "@/app/common/Layout";
import { formatDate } from "@/helpers/date";
import { db } from "@/lib/firebase";
import {
  Button,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from "@nextui-org/react";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, Timestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Deposit = {
  id: string;
  username: string;
  userEmail: string; // Add userEmail to the Deposit type
  amount: number;
  status: "pending" | "confirmed" | "failed";
  createdAt: Timestamp;
};

const DepositManagement = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDeposit, setNewDeposit] = useState<Omit<Deposit, "id" | "createdAt">>({
    username: "",
    userEmail: "", // Initialize userEmail
    amount: 0,
    status: "pending",
  });

  useEffect(() => {
    const depositsCollection = collection(db, "deposits");
    const q = query(depositsCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const depositsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Deposit[];
      setDeposits(depositsData);
      setLoading(false);
    }, (err) => {
      setError("Failed to fetch deposits: " + err.message);
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddDeposit = async () => {
    try {
      await addDoc(collection(db, "deposits"), {
        ...newDeposit,
        createdAt: Timestamp.now(),
      });

      // Update user's wallet balance
      const userRef = doc(db, "users", newDeposit.userEmail); // Use userEmail
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentBalance = userDoc.data().walletBalance || 0;
        await updateDoc(userRef, {
          walletBalance: currentBalance + newDeposit.amount,
        });
      } else {
        console.error("User document not found");
      }

      setNewDeposit({
        username: "",
        userEmail: "", // Reset userEmail
        amount: 0,
        status: "pending",
      });
    } catch (err) {
      console.error("Error adding deposit:", err);
      setError("Failed to add deposit");
    }
  };

  const handleStatusChange = async (
    depositId: string,
    newStatus: "confirmed" | "failed"
  ) => {
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, "deposits", depositId);
        const depositDoc = await transaction.get(depositRef);
        
        if (!depositDoc.exists()) {
          throw new Error("Deposit document does not exist!");
        }

        const depositData = depositDoc.data() as Deposit;
        
        if (newStatus === "confirmed" && depositData.status !== "confirmed") {
          // Find wallet document
          const walletRef = doc(db, "wallets", depositData.userEmail); // Use userEmail
          const walletDoc = await transaction.get(walletRef);
          
          if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            transaction.update(walletRef, { balance: currentBalance + depositData.amount });
          } else {
            transaction.set(walletRef, { balance: depositData.amount });
          }
        } else if (newStatus === "failed" && depositData.status === "confirmed") {
          // If changing from confirmed to failed, deduct the amount from the wallet
          const walletRef = doc(db, "wallets", depositData.userEmail); // Use userEmail
          const walletDoc = await transaction.get(walletRef);
          
          if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            const newBalance = Math.max(currentBalance - depositData.amount, 0);
            transaction.update(walletRef, { balance: newBalance });
          }
        }

        // Update deposit status
        transaction.update(depositRef, { status: newStatus });
      });

      toast.success(`Deposit status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating deposit status:", err);
      setError("Failed to update deposit status");
      toast.error("Failed to update deposit status");
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
    <div>
      <div className="mb-4">
        <Input
          type="text"
          label="Username" // Change label to Username
          value={newDeposit.username}
          onChange={(e) =>
            setNewDeposit({ ...newDeposit, username: e.target.value })
          }
          className="mb-2"
        />
        <Input
          type="text"
          label="User Email" // Add input for User Email
          value={newDeposit.userEmail}
          onChange={(e) =>
            setNewDeposit({ ...newDeposit, userEmail: e.target.value })
          }
          className="mb-2"
        />
        <Input
          type="number"
          label="Deposit Amount"
          value={newDeposit.amount.toString()}
          onChange={(e) =>
            setNewDeposit({
              ...newDeposit,
              amount: Number(e.target.value),
            })
          }
          className="mb-2"
        />
        <select
          value={newDeposit.status}
          onChange={(e) =>
            setNewDeposit({
              ...newDeposit,
              status: e.target.value as "pending" | "confirmed" | "failed",
            })
          }
          className="mb-2 p-2 border rounded"
        >
          <option value="pending">Pending</option>
          <option value="confirmed">confirmed</option>
          <option value="failed">Failed</option>
        </select>
        <Button onClick={handleAddDeposit}>Add Deposit</Button>
      </div>
      <Table
        aria-label="Deposits Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn key="documentId">Document ID</TableColumn>
          <TableColumn key="username">Username</TableColumn>
          <TableColumn key="userEmail">User Email</TableColumn>
          <TableColumn key="amount">Amount</TableColumn>
          <TableColumn key="status">Status</TableColumn>
          <TableColumn key="date">Date</TableColumn>
          <TableColumn key="actions">Actions</TableColumn>
        </TableHeader>  
        <TableBody>
          {deposits.length > 0 ? (
            deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell>{deposit.id}</TableCell>
                <TableCell>{deposit.username}</TableCell>
                <TableCell>{deposit.userEmail}</TableCell>
                <TableCell>{deposit.amount}</TableCell>
                <TableCell>{deposit.status}</TableCell>
                <TableCell>{formatDate(deposit.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={() =>
                      handleStatusChange(deposit.id, "confirmed")
                    }
                    disabled={deposit.status === "confirmed"}
                  >
                    confirm
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    className="ml-2"
                    onClick={() => handleStatusChange(deposit.id, "failed")}
                    disabled={deposit.status === "failed"}
                  >
                    Fail
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>
                <div className="text-center">No One Has Deposited Yet.</div>
              </TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
              <TableCell>{""}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DepositManagement;
