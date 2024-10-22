"use client";

import { useEffect, useState } from "react";
import { Spinner, Input } from "@nextui-org/react";
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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setLoading(true);
      try {
        const userEmail = auth.currentUser?.email;
        const withdrawalsCollection = collection(db, "withdrawals");
        const q = query(withdrawalsCollection, where("userEmail", "==", userEmail));
        const withdrawalsSnapshot = await getDocs(q);
        const withdrawalsData = withdrawalsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          amount: parseFloat(doc.data().amount) || 0, // Ensure amount is a number
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

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const dateMatch = formatDate(withdrawal.date).toLowerCase().includes(searchTerm.toLowerCase());
    return dateMatch || searchTerm === ""; // Only filter by date
  });

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
      <p className="text-light mb-2">Use the search bar to filter withdrawals by date.</p>
      <Input
        isClearable
        placeholder="Search by Date"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      {filteredWithdrawals.length === 0 ? (
        <p className="text-light">No withdrawals found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-light min-w-full">
            <thead>
              <tr className="text-gray-400 text-xs sm:text-sm border-b border-dashed border-gray">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="border-b border-gray hover:bg-gray-700">
                  <td className="py-2">{formatDate(withdrawal.date)}</td>
                  <td className="py-2">
                    {withdrawal.status === "Pending" ? (
                      <span className="text-orange-500">Pending</span>
                    ) : (
                      <span className="text-green-500">Completed</span>
                    )}
                  </td>
                  <td className="py-2 text-right">${withdrawal.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
