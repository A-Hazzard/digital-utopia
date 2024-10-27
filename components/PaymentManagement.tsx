"use client";

import { db } from '@/lib/firebase';
import { Button, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

interface Payment {
  id: string;
  userName: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

const PaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const paymentsCollection = collection(db, "payments");
        const paymentsSnapshot = await getDocs(paymentsCollection);
        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Payment[];
        setPayments(paymentsData);
      } catch (err) {
        setError("Failed to fetch payments");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const handleStatusChange = (paymentId: string, newStatus: 'completed' | 'failed') => {
    setPayments(payments.map(payment => 
      payment.id === paymentId ? { ...payment, status: newStatus } : payment
    ));
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
    <div>
      <Table aria-label="Payments Table" className="text-light rounded-lg shadow-md bg-transparent">
        <TableHeader>
          <TableColumn>User</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.userName}</TableCell>
              <TableCell>{payment.amount}</TableCell>
              <TableCell>{payment.status}</TableCell>
              <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button size="sm" color="primary" onClick={() => handleStatusChange(payment.id, "completed")}>Complete</Button>
                <Button size="sm" color="danger" className="ml-2" onClick={() => handleStatusChange(payment.id, "failed")}>Fail</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentManagement;
