"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Spinner, Input, Card } from "@nextui-org/react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import Layout from "@/app/common/Layout";
import { formatDate } from "@/helpers/date";
import { User } from "firebase/auth";
import gsap from "gsap";

interface Withdrawal {
  id: string;
  userEmail: string;
  amount: number;
  date: Date;
  status: string;
}

export default function Withdrawals() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const titleRef = useRef(null);
  const cardRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchWithdrawals(user.email || "");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      gsap.from(titleRef.current, { opacity: 0, y: -50, duration: 1, ease: "power3.out" });
      gsap.from(cardRef.current, { opacity: 0, y: 50, duration: 1, delay: 0.3, ease: "power3.out" });
      gsap.from(tableRef.current, { opacity: 0, y: 50, duration: 1, delay: 0.6, ease: "power3.out" });
    }
  }, [loading]);

  const fetchWithdrawals = async (userEmail: string) => {
    setLoading(true);
    try {
      const withdrawalsCollection = collection(db, "withdrawals");
      const q = query(withdrawalsCollection, where("userEmail", "==", userEmail));
      const withdrawalsSnapshot = await getDocs(q);
      const withdrawalsData = withdrawalsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        amount: parseFloat(doc.data().amount) || 0,
      })) as Withdrawal[];
      setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const dateMatch = formatDate(withdrawal.date).toLowerCase().includes(searchTerm.toLowerCase());
    return dateMatch || searchTerm === "";
  });

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" />
        </div>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <h1 ref={titleRef} className="text-3xl md:text-4xl font-bold mb-6 text-light text-center">Your Withdrawals</h1>
        <Card ref={cardRef} className="bg-darker p-6 mb-8">
          <p className="text-light mb-4">Use the search bar to filter withdrawals by date.</p>
          <Input
            isClearable
            placeholder="Search by Date"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
        </Card>
        {filteredWithdrawals.length === 0 ? (
          <p className="text-light text-center">No withdrawals found.</p>
        ) : (
          <div ref={tableRef} className="overflow-x-auto">
            <table className="text-light min-w-full">
              <thead>
                <tr className="text-gray-400 text-sm md:text-base border-b border-gray-700">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-gray-700 hover:bg-gray-800 transition-colors duration-200">
                    <td className="py-4 px-3">{formatDate(withdrawal.date)}</td>
                    <td className="py-4 px-3">
                      {withdrawal.status === "Pending" ? (
                        <span className="text-orange-500 bg-orange-500 bg-opacity-20 px-2 py-1 rounded-full text-xs font-semibold">Pending</span>
                      ) : (
                        <span className="text-green-500 bg-green-500 bg-opacity-20 px-2 py-1 rounded-full text-xs font-semibold">Completed</span>
                      )}
                    </td>
                    <td className="py-4 px-3 text-right">${withdrawal.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
