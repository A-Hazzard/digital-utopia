"use client";

import { useState } from "react";
import { Table, Button, TableHeader, TableColumn, TableCell, TableBody, TableRow } from "@nextui-org/react";

// Define the Payment interface
interface Payment {
  id: string;
  userName: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

// Fake data for prototyping
const fakePayments: Payment[] = [
  { id: '1', userName: 'John Doe', amount: "100 USDT", status: 'pending', date: new Date().toISOString() },
  { id: '2', userName: 'Jane Smith', amount: "200 USDT", status: 'completed', date: new Date().toISOString() },
  { id: '3', userName: 'Bob Johnson', amount: "150 USDT", status: 'failed', date: new Date().toISOString() },
];

const PaymentManagement = () => {
  const [payments, setPayments] = useState<Payment[]>(fakePayments);

  const handleStatusChange = (paymentId: string, newStatus: 'completed' | 'failed') => {
    setPayments(payments.map(payment => 
      payment.id === paymentId ? { ...payment, status: newStatus } : payment
    ));
  };

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">Payment Management</h2>
      <Table
        aria-label="Payments Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
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
              <TableCell>
                {new Date(payment.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => handleStatusChange(payment.id, "completed")}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  className="ml-2"
                  onClick={() => handleStatusChange(payment.id, "failed")}
                >
                  Fail
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentManagement;
