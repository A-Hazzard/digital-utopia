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
  Pagination,
} from "@nextui-org/react";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import Image from "next/image";
import { formatDate } from "@/helpers/date";
import { toast } from "react-toastify";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

// Define the Trade interface
interface Trade {
  id: string;
  date: string;
  type: "win" | "loss";
  amount: number;
  tradingPair: string;
  userEmail: string;
  iconUrl: string;
}

// Define the TradingPair interface
interface TradingPair {
  id: string;
  pair: string;
  iconUrl: string;
}

const ITEMS_PER_PAGE = 50;

const TradeResultsManagement = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [newTrade, setNewTrade] = useState<Omit<Trade, "id">>({
    date: "",
    type: "win",
    amount: 0,
    tradingPair: "",
    userEmail: "",
    iconUrl: "",
  });
  const [showAddPair, setShowAddPair] = useState(false);
  const [newPair, setNewPair] = useState("");
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [newPairIcon, setNewPairIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Function to fetch trades from Firestore
  const fetchTrades = async () => {
    const tradesCollection = collection(db, "trades");
    const q = query(tradesCollection, orderBy("date", "desc"), limit(ITEMS_PER_PAGE));
    const tradesSnapshot = await getDocs(q);
    const tradesData = tradesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      amount: Number(doc.data().amount),
    })) as Trade[];
    setTrades(tradesData);
    setTotalPages(Math.ceil(tradesSnapshot.size / ITEMS_PER_PAGE));
  };

  // Function to fetch trading pairs from Firestore
  const fetchTradingPairs = async () => {
    const pairsCollection = collection(db, "tradingPairs");
    const pairsSnapshot = await getDocs(pairsCollection);
    const pairsData = pairsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TradingPair[];
    setTradingPairs(pairsData);
  };

  // Fetch trades and trading pairs when the component mounts
  useEffect(() => {
    const unsubscribeTrades = listenToTrades();
    const unsubscribePairs = listenToTradingPairs();

    return () => {
      unsubscribeTrades();
      unsubscribePairs();
    };
  }, []);

  const listenToTrades = () => {
    const tradesCollection = collection(db, "trades");
    return onSnapshot(tradesCollection, (snapshot) => {
      const tradesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        amount: Number(doc.data().amount),
      })) as Trade[];
      setTrades(tradesData);
    });
  };

  const listenToTradingPairs = () => {
    const pairsCollection = collection(db, "tradingPairs");
    return onSnapshot(pairsCollection, (snapshot) => {
      const pairsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TradingPair[];
      setTradingPairs(pairsData);
    });
  };

  

  useEffect(() => {
    const validateForm = () => {
      const isValid = 
        newTrade.date !== "" &&
        (newTrade.type === "win" || newTrade.type === "loss") &&
        newTrade.amount > 0 &&
        newTrade.userEmail !== "" &&
        selectedPair !== null;
      setIsFormValid(isValid);
    };

    validateForm();
  }, [newTrade, selectedPair]);

  const handleAddTrade = async () => {
    if (!isFormValid) {
      return;
    }

    try {
      await addDoc(collection(db, "trades"), {
        ...newTrade,
        tradingPair: selectedPair,
        iconUrl: tradingPairs.find(pair => pair.pair === selectedPair)?.iconUrl || "",
      });
      resetForm();
      toast.success("Trade added successfully");
    } catch (error) {
      console.error("Error adding trade:", error);
      toast.error("Failed to add trade");
    }
  };

  const handleAddPair = async () => {
    if (newPair && newPairIcon) {
      const iconRef = ref(storage, `tradingPairIcons/${newPairIcon.name}`);
      await uploadBytes(iconRef, newPairIcon);
      const iconUrl = await getDownloadURL(iconRef);

      await addDoc(collection(db, "tradingPairs"), {
        pair: newPair,
        iconUrl: iconUrl,
      });
      setNewPair("");
      setNewPairIcon(null);
      setIconPreview(null);
      setShowAddPair(false);
      
      // Refresh the trading pairs
      await fetchTradingPairs();
    }
  };

  const resetForm = () => {
    setNewTrade({
      date: "",
      type: "win",
      amount: 0,
      tradingPair: "",
      userEmail: "",
      iconUrl: "",
    });
    setSelectedPair(null);
  };

  const handlePairSelect = (pair: string) => {
    setSelectedPair(pair);
    setNewTrade({ ...newTrade, tradingPair: pair });
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPairIcon(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTrades(); // Fetch trades for the selected page
  };

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          label="Date"
          value={newTrade.date}
          onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
          required
        />
        <select
          value={newTrade.type}
          onChange={(e) =>
            setNewTrade({ ...newTrade, type: e.target.value as "win" | "loss" })
          }
          className="p-2 border rounded bg-transparent text-light"
          required
        >
          <option value="">Select Type</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </select>
        <Input
          type="number"
          label="Amount"
          value={newTrade.amount.toString()}
          onChange={(e) =>
            setNewTrade({ ...newTrade, amount: Number(e.target.value) })
          }
          required
        />
        <Input
          type="email"
          label="User Email"
          value={newTrade.userEmail}
          onChange={(e) =>
            setNewTrade({ ...newTrade, userEmail: e.target.value })
          }
          required
        />
      </div>

      {/* Trading Pair Selection */}
      <div className="mb-4">
        <p className="text-sm text-light mb-2">Trading Pairs:</p>
        <div className="flex flex-wrap gap-2">
          {tradingPairs.map((pair) => (
            <div
              key={pair.id}
              className={`flex items-center text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
                selectedPair === pair.pair
                  ? "bg-white text-black"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
              onClick={() => handlePairSelect(pair.pair)}
            >
              {pair.iconUrl && (
                <Image
                  src={pair.iconUrl}
                  alt={`${pair.pair} icon`}
                  width={16}
                  height={16}
                  className="mr-1"
                />
              )}
              {pair.pair}
            </div>
          ))}
          <div
            className="bg-blue-500 text-white text-xs py-1 px-2 rounded-md cursor-pointer hover:bg-blue-600 transition-colors"
            onClick={() => setShowAddPair(true)}
          >
            Add Trading Pair
          </div>
        </div>
      </div>

      {showAddPair && (
        <div className="mb-4 flex flex-col gap-2">
          <Input
            type="text"
            placeholder="Enter new trading pair"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value)}
          />
          <Input
            type="file"
            accept="image/*"
            onChange={handleIconFileChange}
          />
          {iconPreview && (
            <div className="w-8 h-8 relative">
              <Image
                src={iconPreview}
                alt="Icon preview"
                layout="fill"
                objectFit="contain"
              />
            </div>
          )}
          <Button onClick={handleAddPair}>Add Pair</Button>
        </div>
      )}

      <Button onClick={handleAddTrade} disabled={!isFormValid} className={`${!isFormValid ? "bg-gray-400 text-gray-600 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}>Add Trade</Button>

      {/* Trades Table */}
      <Table
        aria-label="Trades Table"
        className="mt-4 text-light rounded-lg shadow-md bg-transparent"
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
              <TableCell>{formatDate(trade.date)}</TableCell>
              <TableCell>{trade.type}</TableCell>
              <TableCell>{trade.amount}</TableCell>
              <TableCell>{trade.userEmail}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  {trade.iconUrl && (
                    <Image
                      src={trade.iconUrl}
                      alt={`${trade.tradingPair} icon`}
                      width={20}
                      height={20}
                      className="mr-2"
                    />
                  )}
                  {trade.tradingPair}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination
        total={totalPages}
        initialPage={1}
        page={currentPage}
        onChange={handlePageChange}
        className="mt-4"
      />
    </div>
  );
};

export default TradeResultsManagement;
