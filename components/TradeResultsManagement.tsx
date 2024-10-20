"use client";

import { useEffect, useState } from "react";
import { Table, Button, TableHeader, TableColumn, TableCell, TableBody, TableRow, Input } from "@nextui-org/react";
import { db } from '@/lib/firebase'; // Adjust the import based on your project structure
import { collection, getDocs } from "firebase/firestore";

// Define the Trade interface
interface Trade {
  id: string;
  date: string;
  type: 'win' | 'loss';
  amount: string;
}

const TradeResultsManagement = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTrade, setNewTrade] = useState<Omit<Trade, 'id'>>({ date: '', type: 'win', amount: '' });

  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      try {
        const tradesCollection = collection(db, "trades");
        const tradesSnapshot = await getDocs(tradesCollection);
        const tradesData = tradesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Trade[];
        setTrades(tradesData);
      } catch (err) {
        setError("Failed to fetch trades");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  const handleAddTrade = () => {
    const id = (trades.length + 1).toString();
    setTrades([...trades, { ...newTrade, id }]);
    setNewTrade({ date: '', type: 'win', amount: '' });
  };

  if (loading) {
    return <p>Loading trades...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

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
