"use client";

import { useEffect, useState } from "react";
import {
  Table,
  Button,
  TableHeader,
  TableColumn,
  TableCell,
  TableBody,
  TableRow,
  Input,
} from "@nextui-org/react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

// Define the Trade interface
interface Trade {
  id: string;
  date: string;
  type: "win" | "loss";
  amount: number; // Change amount to type number
  tradingPair: string;
  userEmail: string; // Added field for user email
  iconUrl: string; // Field for SVG icon URL
}

const TradeResultsManagement = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [newTrade, setNewTrade] = useState<Omit<Trade, "id">>({
    date: "",
    type: "win",
    amount: 0, // Initialize amount as a number
    tradingPair: "",
    userEmail: "", // Initialize user email
    iconUrl: "",
  });
  const [iconFile, setIconFile] = useState<File | null>(null);

  // Function to fetch trades from Firestore
  const fetchTrades = async () => {
    const tradesCollection = collection(db, "trades");
    const tradesSnapshot = await getDocs(tradesCollection);
    const tradesData = tradesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount), // Ensure amount is a number
    })) as Trade[];
    setTrades(tradesData);
  };

  // Fetch trades when the component mounts
  useEffect(() => {
    fetchTrades();
  }, []);

  const handleAddTrade = async () => {
    if (iconFile) {
      // Validate file type
      if (iconFile.type !== "image/svg+xml") {
        alert("Please upload an SVG file only.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const iconUrl = reader.result as string; // Get the base64 URL of the SVG
        await addDoc(collection(db, "trades"), { ...newTrade, iconUrl }); // Save to Firestore
        setNewTrade({
          date: "",
          type: "win",
          amount: 0, // Reset amount to a number
          tradingPair: "",
          userEmail: "", // Reset user email
          iconUrl: "",
        });
        setIconFile(null); // Reset the file input
        fetchTrades(); // Fetch trades again to update the list
      };
      reader.readAsDataURL(iconFile); // Read the file as a data URL
    }
  };

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">
        Trade Results Management
      </h2>
      <Table
        aria-label="Trades Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>Date</TableColumn>
          <TableColumn>Type</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>User Email</TableColumn>
          <TableColumn>Trading Pair</TableColumn>
        </TableHeader>
        <TableBody>
          {trades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{new Date(trade.date).toLocaleDateString()}</TableCell>
              <TableCell>{trade.type}</TableCell>
              <TableCell>{trade.amount}</TableCell>
              <TableCell>{trade.userEmail}</TableCell>
              <TableCell>{trade.tradingPair}</TableCell>
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
          onChange={(e) =>
            setNewTrade({ ...newTrade, type: e.target.value as "win" | "loss" })
          }
          className="mb-2 p-2 border rounded"
        >
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </select>
        <Input
          type="number" // Change input type to number
          label="Amount"
          value={newTrade.amount.toString()}
          onChange={(e) =>
            setNewTrade({ ...newTrade, amount: Number(e.target.value) })
          } // Convert to number
          className="mb-2"
        />
        <Input
          type="text"
          label="Trading Pair"
          value={newTrade.tradingPair}
          onChange={(e) =>
            setNewTrade({ ...newTrade, tradingPair: e.target.value })
          }
          className="mb-2"
        />
        <Input
          type="text"
          label="User Email" // Added input for user email
          value={newTrade.userEmail}
          onChange={(e) =>
            setNewTrade({ ...newTrade, userEmail: e.target.value })
          }
          className="mb-2"
        />
        <Input
          type="file"
          accept=".svg"
          label="Upload Trading Pair Icon" // Input for SVG icon
          onChange={(e) => setIconFile(e.target.files?.[0] || null)}
          className="mb-2"
        />
        <Button onClick={handleAddTrade}>Add Trade</Button>
      </div>
    </div>
  );
};

export default TradeResultsManagement;
