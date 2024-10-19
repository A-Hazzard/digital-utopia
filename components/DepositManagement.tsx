"use client";

import { useState } from "react";
import { Table, Button, TableHeader, TableColumn, TableCell, TableBody, TableRow } from "@nextui-org/react";

// Define the Deposit interface
interface Deposit {
  id: string;
  userName: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
}

// Fake data for prototyping
const fakeDeposits: Deposit[] = [
  { id: '1', userName: 'John Doe', amount: "1000 USDT", status: 'pending', date: new Date().toISOString() },
  { id: '2', userName: 'Jane Smith', amount: "750 USDT", status: 'completed', date: new Date().toISOString() },
  { id: '3', userName: 'Bob Johnson', amount: "500 USDT", status: 'failed', date: new Date().toISOString() },
];

const DepositManagement = () => {
  const [deposits, setDeposits] = useState<Deposit[]>(fakeDeposits);

  const handleStatusChange = (depositId: string, newStatus: 'completed' | 'failed') => {
    setDeposits(deposits.map(deposit => 
      deposit.id === depositId ? { ...deposit, status: newStatus } : deposit
    ));
  };

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">Deposit Management</h2>
      <Table aria-label="Deposits Table" className="text-light rounded-lg shadow-md bg-transparent">
        <TableHeader>
          <TableColumn>User</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {deposits.map((deposit) => (
            <TableRow key={deposit.id}>
              <TableCell>{deposit.userName}</TableCell>
              <TableCell>{deposit.amount}</TableCell>
              <TableCell>{deposit.status}</TableCell>
              <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button size="sm" color="primary" onClick={() => handleStatusChange(deposit.id, 'completed')}>Complete</Button>
                <Button size="sm" color="danger" className="ml-2" onClick={() => handleStatusChange(deposit.id, 'failed')}>Fail</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DepositManagement;
