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
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Search User by Username</h2>
        <p className="text-sm text-light mb-2">
          Enter a username to find the associated user email. This can help you quickly locate user information if you cannot remember their email.
        </p>
        <Input
          type="text"
          label="Search by Username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            fetchUserEmailByUsername(e.target.value);
          }}
        />
        {possibleEmails.length > 0 && (
          <div className="bg-white border rounded mt-2 p-2">
            <h3 className="text-sm font-semibold">Possible Emails:</h3>
            <ul className="list-disc pl-5">
              {possibleEmails.map((email, index) => (
                <li key={index} className="text-sm text-dark cursor-pointer" onClick={() => setNewTrade({ ...newTrade, userEmail: email })}>
                  {email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <hr className="mt-4 mb-10" />

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

      <div className="mb-4">
        <p className="text-sm text-light mb-2">Trading Pairs:</p>
        <div className="flex flex-wrap gap-2">
          {tradingPairs.map((pair) => (
            <div
              key={pair.id}
              className={`relative flex items-center text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
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
              <X
                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 cursor-pointer text-red-500 hover:text-red-700"
                style={{ width: '15px', height: '15px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePair(pair.id);
                }}
              />
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

      <Table
        aria-label="Trades Table"
        className="mt-4 text-light rounded-lg shadow-md bg-transparent"
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
              <TableCell>{trade.type}</TableCell>
              <TableCell>{trade.amount}</TableCell>
              <TableCell>{trade.userEmail}</TableCell>
              <TableCell>{trade.username}</TableCell>
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
