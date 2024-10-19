"use client";

import { useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button } from "@nextui-org/react";

// Define the Withdrawal interface
interface Withdrawal {
  id: string;
  userName: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

// Fake data for prototyping
const fakeWithdrawals: Withdrawal[] = [
  { id: '1', userName: 'John Doe', amount: "500 USDT", status: 'pending', date: new Date().toISOString() },
  { id: '2', userName: 'Jane Smith', amount: "750 USDT", status: 'completed', date: new Date().toISOString() },
  { id: '3', userName: 'Bob Johnson', amount: "1000 USDT", status: 'failed', date: new Date().toISOString() },
];

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(fakeWithdrawals);

  const handleStatusChange = (withdrawalId: string, newStatus: 'completed' | 'failed') => {
    setWithdrawals(withdrawals.map(withdrawal => 
      withdrawal.id === withdrawalId ? { ...withdrawal, status: newStatus } : withdrawal
    ));
  };

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">
        Withdrawal Management
      </h2>
      <Table
        aria-label="Withdrawals Table"
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
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal.id}>
              <TableCell>{withdrawal.userName}</TableCell>
              <TableCell>{withdrawal.amount}</TableCell>
              <TableCell>{withdrawal.status}</TableCell>
              <TableCell>
                {new Date(withdrawal.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => handleStatusChange(withdrawal.id, "completed")}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  className="ml-2"
                  onClick={() => handleStatusChange(withdrawal.id, "failed")}
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

export default WithdrawalManagement;
