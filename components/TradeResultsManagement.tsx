"use client";

import { useState } from "react";
import { Table, Button, TableHeader, TableColumn, TableCell, TableBody, TableRow, Input } from "@nextui-org/react";

// Define the Trade interface
interface Trade {
  id: string;
  date: string;
  type: 'win' | 'loss';
  amount: string;
}

// Fake data for prototyping
const fakeTrades: Trade[] = [
  { id: '1', date: new Date().toISOString(), type: 'win', amount: "100 USDT" },
  { id: '2', date: new Date().toISOString(), type: 'loss', amount: "50 USDT" },
  { id: '3', date: new Date().toISOString(), type: 'win', amount: "200 USDT" },
];

const TradeResultsManagement = () => {
  const [trades, setTrades] = useState<Trade[]>(fakeTrades);
  const [newTrade, setNewTrade] = useState<Omit<Trade, 'id'>>({ date: '', type: 'win', amount: '' });

  const handleAddTrade = () => {
    const id = (trades.length + 1).toString();
    setTrades([...trades, { ...newTrade, id }]);
    setNewTrade({ date: '', type: 'win', amount: '' });
  };

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">Trade Results Management</h2>
      <Table aria-label="Trades Table" className="text-light rounded-lg shadow-md bg-transparent">
        <TableHeader>
          <TableColumn>Date</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn>Amount</TableColumn>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
              <TableCell>{trade.type}</TableCell>
              <TableCell>{trade.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-4">
        <Input
          type="date"
          label="Date"
          value={newTrade.date}
          onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
          className="mb-2"
        />
        <select 
          value={newTrade.type} 
          onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value as 'win' | 'loss' })}
          className="mb-2 p-2 border rounded"
        >
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </select>
        <Input
          type="text"
          label="Amount"
          value={newTrade.amount}
          onChange={(e) => setNewTrade({ ...newTrade, amount: e.target.value })}
          className="mb-2"
        />
        <Button onClick={handleAddTrade}>Add Trade</Button>
      </div>
    </div>
  );
};

export default TradeResultsManagement;
