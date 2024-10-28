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
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, runTransaction, Timestamp, updateDoc } from "firebase/firestore";
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
  const [newDeposit, setNewDeposit] = useState<Omit<Deposit, "id" | "createdAt">>({
    username: "",
    userEmail: "",
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

  useEffect(() => {
    gsap.from(".deposit-table", { opacity: 0, y: -50, duration: 0.5, stagger: 0.1 });
  }, []);

  const handleAddDeposit = async () => {
    try {
      await addDoc(collection(db, "deposits"), {
        ...newDeposit,
        createdAt: Timestamp.now(),
      });

      const userRef = doc(db, "users", newDeposit.userEmail);
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
        userEmail: "",
        amount: 0,
        status: "pending",
      });
      toast.success("Deposit added successfully");
    } catch (err) {
      console.error("Error adding deposit:", err);
      setError("Failed to add deposit");
      toast.error("Failed to add deposit");
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
          const walletRef = doc(db, "wallets", depositData.userEmail);
          const walletDoc = await transaction.get(walletRef);
          
          if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            transaction.update(walletRef, { balance: currentBalance + depositData.amount });
          } else {
            transaction.set(walletRef, { balance: depositData.amount });
          }
          
          await handleAddDeposit();
        } else if (newStatus === "failed" && depositData.status === "confirmed") {
          const walletRef = doc(db, "wallets", depositData.userEmail);
          const walletDoc = await transaction.get(walletRef);
          
          if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            const newBalance = Math.max(currentBalance - depositData.amount, 0);
            transaction.update(walletRef, { balance: newBalance });
          }
        }

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
    </div>
  );
};

export default DepositManagement;
