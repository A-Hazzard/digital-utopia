"use client";

import { formatDate } from "@/helpers/date";
import { db, storage } from "@/lib/firebase";
import {
  Button,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Trade = {
  id: string;
  date: string;
  type: "win" | "loss";
  amount: number;
  tradingPair: string;
  userEmail: string;
  iconUrl: string;
  username: string;
}

type TradingPair = {
  id: string;
  pair: string;
  iconUrl: string;
}

type ProfitData = {
  profit: number;
  username: string;
  email?: string;
  [key: string]: number | string | undefined;
}

const ITEMS_PER_PAGE = 50;

const TradeResultsManagement = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [newTrade, setNewTrade] = useState<Omit<Trade, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "win",
    amount: 0,
    tradingPair: "",
    userEmail: "",
    iconUrl: "",
    username: "",
  });
  const [showAddPair, setShowAddPair] = useState(false);
  const [newPair, setNewPair] = useState("");
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const [newPairIcon, setNewPairIcon] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [username, setUsername] = useState("");
  const [possibleEmails, setPossibleEmails] = useState<string[]>([]);

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

  const fetchTradingPairs = async () => {
    const pairsCollection = collection(db, "tradingPairs");
    const pairsSnapshot = await getDocs(pairsCollection);
    const pairsData = pairsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TradingPair[];
    setTradingPairs(pairsData);
  };

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
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("email", "==", newTrade.userEmail));
      const snapshot = await getDocs(q);
      const userDoc = snapshot.docs[0];
      const username = userDoc ? userDoc.data().displayName : "";

      await addDoc(collection(db, "trades"), {
        ...newTrade,
        tradingPair: selectedPair,
        iconUrl: tradingPairs.find(pair => pair.pair === selectedPair)?.iconUrl || "",
        username: username,
      });

      const profitAmount = newTrade.type === "win" ? newTrade.amount : -newTrade.amount;
      await updateUserProfit(newTrade.userEmail, username, profitAmount);

      resetForm();
      toast.success("Trade added successfully");
    } catch (error) {
      console.error("Error adding trade:", error);
      toast.error("Failed to add trade");
    }
  };

  const updateUserProfit = async (userEmail: string, username: string, profitAmount: number) => {
    const profitRef = doc(db, "profits", userEmail);
    
    try {
      await runTransaction(db, async (transaction) => {
        const profitDoc = await transaction.get(profitRef);
        if (profitDoc.exists()) {
          const currentData = profitDoc.data() as ProfitData;
          const currentProfit = currentData.profit || 0;
          const updateData: ProfitData = {
            profit: currentProfit + profitAmount,
            username: username
          };

          if (!currentData.email) {
            updateData.email = userEmail;
          }

          transaction.update(profitRef, updateData);
        } else {
          transaction.set(profitRef, {
            profit: profitAmount,
            username: username,
            email: userEmail
          });
        }
      });
    } catch (error) {
      console.error("Error updating profit:", error);
      throw error;
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
      username: "",
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
    fetchTrades();
  };

  const fetchUserEmailByUsername = async (username: string) => {
    if (!username) {
      setPossibleEmails([]);
      return;
    }

    try {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);

      const emails = snapshot.docs
          .filter(doc => doc.data().displayName.toLowerCase().includes(username.toLowerCase()))
          .map(doc => doc.data().email);

      setPossibleEmails(emails);
    } catch (error) {
      console.error("Error fetching user email:", error);
      setPossibleEmails([]);
    }
  };

  const handleDeletePair = async (pairId: string) => {
    try {
      const pairDoc = doc(db, "tradingPairs", pairId);
      await deleteDoc(pairDoc);
      toast.success("Trading pair deleted successfully");
      await fetchTradingPairs();
    } catch (error) {
      console.error("Error deleting trading pair:", error);
      toast.error("Failed to delete trading pair");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
      {/* User Search Section */}
      <div className="bg-darker p-6 rounded-xl border border-readonly/30 mb-8">
        <h2 className="text-xl font-bold mb-2">Search User</h2>
        <p className="text-gray mb-4">
          Enter a username to find the associated user email.
        </p>
        <Input
          type="text"
          label="Search by Username"
          value={username}
          classNames={{
            input: "bg-dark text-light",
            label: "text-gray"
          }}
          onChange={(e) => {
            setUsername(e.target.value);
            fetchUserEmailByUsername(e.target.value);
          }}
          className="max-w-md"
        />
        {possibleEmails.length > 0 && (
          <div className="mt-4 p-4 bg-dark rounded-lg border border-readonly/30">
            <h3 className="font-semibold mb-2">Matching Emails:</h3>
            <ul className="space-y-2">
              {possibleEmails.map((email, index) => (
                <li 
                  key={index} 
                  className="text-gray hover:text-orange cursor-pointer transition-colors p-2 rounded hover:bg-readonly"
                  onClick={() => setNewTrade({ ...newTrade, userEmail: email })}
                >
                  {email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Trade Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-darker p-6 rounded-xl border border-readonly/30">
          <h2 className="text-xl font-bold mb-4">Add New Trade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              type="date"
              label="Date"
              value={newTrade.date}
              onChange={(e) => setNewTrade({ ...newTrade, date: e.target.value })}
              className="w-full"
            />
            <select
              value={newTrade.type}
              onChange={(e) => setNewTrade({ ...newTrade, type: e.target.value as "win" | "loss" })}
              className="w-full p-2 border rounded bg-dark/50 text-light focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Type</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
            <Input
              type="number"
              label="Amount"
              value={newTrade.amount.toString()}
              onChange={(e) => setNewTrade({ ...newTrade, amount: Number(e.target.value) })}
            />
            <Input
              type="email"
              label="User Email"
              value={newTrade.userEmail}
              onChange={(e) => setNewTrade({ ...newTrade, userEmail: e.target.value })}
            />
          </div>
          <Button 
            onClick={handleAddTrade} 
            disabled={!isFormValid} 
            className={`w-full ${!isFormValid ? "bg-readonly text-gray" : "bg-orange hover:bg-orange/90"} transition-colors`}
          >
            Add Trade
          </Button>
        </div>

        {/* Trading Pairs Section */}
        <div className="bg-darker p-6 rounded-xl border border-readonly/30">
          <h2 className="text-xl font-bold mb-4">Trading Pairs</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {tradingPairs.map((pair) => (
              <div
                key={pair.id}
                className={`relative group flex items-center text-sm py-2 px-3 rounded-lg cursor-pointer transition-all ${
                  selectedPair === pair.pair
                    ? "bg-orange text-light"
                    : "bg-readonly text-gray hover:text-light"
                }`}
                onClick={() => handlePairSelect(pair.pair)}
              >
                {pair.iconUrl && (
                  <Image
                    src={pair.iconUrl}
                    alt={`${pair.pair} icon`}
                    width={20}
                    height={20}
                    className="mr-2"
                  />
                )}
                {pair.pair}
                <X
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white rounded-full p-1"
                  style={{ width: '20px', height: '20px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePair(pair.id);
                  }}
                />
              </div>
            ))}
            <Button
              className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              onClick={() => setShowAddPair(true)}
            >
              Add Pair
            </Button>
          </div>

          {showAddPair && (
            <div className="space-y-4 p-4 bg-white/5 rounded-lg">
              <Input
                type="text"
                placeholder="Enter trading pair"
                value={newPair}
                onChange={(e) => setNewPair(e.target.value)}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={handleIconFileChange}
              />
              {iconPreview && (
                <div className="w-12 h-12 relative rounded-lg overflow-hidden">
                  <Image
                    src={iconPreview}
                    alt="Icon preview"
                    layout="fill"
                    objectFit="contain"
                  />
                </div>
              )}
              <Button onClick={handleAddPair} className="w-full bg-primary hover:bg-primary/80">
                Add Trading Pair
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-darker p-6 rounded-xl border border-readonly/30">
        <h2 className="text-xl font-bold mb-4">Trade History</h2>
        <Table
          aria-label="Trades Table"
          className="rounded-lg shadow-md"
          classNames={{
            th: "bg-readonly text-light",
            td: "text-gray"
          }}
        >
          <TableHeader>
            <TableColumn key="date">Date</TableColumn>
            <TableColumn key="type">Type</TableColumn>
            <TableColumn key="amount">Amount</TableColumn>
            <TableColumn key="userEmail">User Email</TableColumn>
            <TableColumn key="username">Username</TableColumn>
            <TableColumn key="tradingPair">Trading Pair</TableColumn>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>{formatDate(trade.date)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    trade.type === 'win' 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-red-500/20 text-red-500'
                  }`}>
                    {trade.type}
                  </span>
                </TableCell>
                <TableCell>${trade.amount}</TableCell>
                <TableCell>{trade.userEmail}</TableCell>
                <TableCell>{trade.username}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {trade.iconUrl && (
                      <Image
                        src={trade.iconUrl}
                        alt={`${trade.tradingPair} icon`}
                        width={20}
                        height={20}
                      />
                    )}
                    <span>{trade.tradingPair}</span>
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
          className="flex justify-center mt-4"
        />
      </div>
    </div>
  )
};

export default TradeResultsManagement;
