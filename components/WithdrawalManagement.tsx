"use client";

import { useEffect, useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@nextui-org/react";
import { db } from '@/lib/firebase'; // Adjust the import based on your project structure
import { collection, getDocs } from "firebase/firestore";

// Define the Withdrawal interface
interface Withdrawal {
  id: string;
  userName: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setLoading(true);
      try {
        const withdrawalsCollection = collection(db, "withdrawals");
        const withdrawalsSnapshot = await getDocs(withdrawalsCollection);
        const withdrawalsData = withdrawalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Withdrawal[];
        setWithdrawals(withdrawalsData);
      } catch (err) {
        setError("Failed to fetch withdrawals");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, []);

  const handleStatusChange = (withdrawalId: string, newStatus: 'completed' | 'failed') => {
    setWithdrawals(withdrawals.map(withdrawal => 
      withdrawal.id === withdrawalId ? { ...withdrawal, status: newStatus } : withdrawal
    ));
  };

  if (loading) {
    return <p>Loading withdrawals...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">Withdrawal Management</h2>
      <Table aria-label="Withdrawals Table" className="text-light rounded-lg shadow-md bg-transparent">
        <TableHeader>
          <TableColumn>User</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal.id}>
              <TableCell>{withdrawal.userName}</TableCell>
              <TableCell>{withdrawal.amount}</TableCell>
              <TableCell>{withdrawal.status}</TableCell>
              <TableCell>{new Date(withdrawal.date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button size="sm" color="primary" onClick={() => handleStatusChange(withdrawal.id, "completed")}>Complete</Button>
                <Button size="sm" color="danger" className="ml-2" onClick={() => handleStatusChange(withdrawal.id, "failed")}>Fail</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WithdrawalManagement;
