"use client";

import { formatDate } from "@/helpers/date";
import { db } from "@/lib/firebase";
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from "@nextui-org/react";
import { collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, Timestamp, updateDoc } from "firebase/firestore";
import { gsap } from "gsap";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Deposit = {
  id: string;
  username: string;
  userEmail: string;
  amount: number;
  status: "pending" | "confirmed" | "failed";
  createdAt: Timestamp;
};

const DepositManagement = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    gsap.from(".deposit-table", { opacity: 0, y: -50, duration: 0.5, stagger: 0.1 });
  }, []);

  

  const updateWallet = async (depositData: Deposit, newStatus: "confirmed" | "failed") => {
    try {
      await runTransaction(db, async (transaction) => {
        const walletRef = doc(db, "wallets", depositData.userEmail);
        const walletDoc = await transaction.get(walletRef);

        if (newStatus === "confirmed" && depositData.status !== "confirmed") {
          if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            // Update the wallet balance by adding the deposit amount to the current balance
            transaction.update(walletRef, { balance: currentBalance + depositData.amount });
          } else {
            // Create new wallet document with initial balance from deposit amount
            transaction.set(walletRef, { balance: depositData.amount });
          }
        } 
      });

      return true; // Indicate success
    } catch (err) {
      console.error("Error updating wallet:", err);
      setError("Failed to update wallet");
      toast.error("Failed to update wallet");
      return false; // Indicate failure
    }
  };

  const handleStatusChange = async (depositId: string, newStatus: "confirmed" | "failed") => {
    try {
      const depositRef = doc(db, "deposits", depositId);
      const depositDoc = await getDoc(depositRef);

      const depositData = depositDoc.data() as Deposit;

      // Update the wallet before the status
      const walletUpdated = await updateWallet(depositData, newStatus);
      
      // If wallet update is successful, update the deposit status
      if (walletUpdated) {
        await updateDoc(depositRef, { status: newStatus });
        toast.success(`Deposit status updated to ${newStatus}`);

        // Send confirmation email to the user
        await fetch('/api/sendDepositConfirmationEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: depositData.userEmail,
            amount: depositData.amount,
            status: newStatus,
          }),
        });
      }
    } catch (err) {
      console.error("Error updating deposit status:", err);
      setError("Failed to update deposit status");
      toast.error("Failed to update deposit status");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
  <div className="bg-darker p-6 rounded-xl border border-readonly/30">
    <h2 className="text-xl font-bold mb-6">Deposits</h2>
    <Table
      aria-label="Deposits Table"
      className="deposit-table"
      classNames={{
        th: "bg-readonly text-light",
        td: "text-gray"
      }}
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
                  {deposit.status !== "confirmed" && deposit.status !== "failed" && (
                      <Button
                        size="sm"
                        color="primary"
                        onClick={() =>
                      handleStatusChange(deposit.id, "confirmed")
                    }
                  >
                    Confirm
                  </Button>
                  )}
                  {deposit.status !== "failed" && deposit.status !== "confirmed" && (
                  <Button
                    size="sm"
                    color="danger"
                    className="ml-2"
                    onClick={() => handleStatusChange(deposit.id, "failed")}
                  >
                    Fail
                  </Button>
                  )}
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
    </div>
  );
};

export default DepositManagement;
