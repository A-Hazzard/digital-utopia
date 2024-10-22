"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Spinner } from "@nextui-org/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Layout from "@/app/common/Layout";
import { formatDate } from "@/helpers/date";

interface Withdrawal {
  id: string;
  userEmail: string;
  amount: number;
  date: Date;
  status: string;
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setLoading(true);
      try {
        const userEmail = auth.currentUser?.email;
        const withdrawalsCollection = collection(db, "withdrawals");
        const q = query(withdrawalsCollection, where("userEmail", "==", userEmail));
        const withdrawalsSnapshot = await getDocs(q);
        const withdrawalsData = withdrawalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Withdrawal[];
        setWithdrawals(withdrawalsData);
      } catch (error) {
        console.error("Error fetching withdrawals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4 text-light">Your Withdrawals</h1>
      {withdrawals.length === 0 ? (
        <p className="text-light">You haven&apos;t made any withdrawals yet.</p>
      ) : (
        <Table aria-label="Withdrawals table" className="text-light rounded-lg shadow-md bg-transparent">
          <TableHeader>
            <TableColumn>Date</TableColumn>
            <TableColumn>Amount</TableColumn>
            <TableColumn>Status</TableColumn>
          </TableHeader>
          <TableBody>
            {withdrawals.map((withdrawal) => (
              <TableRow key={withdrawal.id}>
                <TableCell>{formatDate(withdrawal.date)}</TableCell>
                <TableCell>${withdrawal.amount.toFixed(2)}</TableCell>
                <TableCell>{withdrawal.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Layout>
  );
}
