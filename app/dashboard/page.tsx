"use client";

import Layout from "@/app/common/Layout";
import DepositFundsModal from "@/components/DepositFundsModal";
import History from "@/components/History";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import WithdrawCryptoModal from "@/components/WithdrawCryptoModal";
import { useProfileModal } from "@/context/ProfileModalContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { Avatar, Button, Spinner } from "@nextui-org/react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";

type Investment = {
  id: string;
  userEmail: string;
  amount: number;
  date: Date;
  status: string;
};

type Trade = {
  id: string;
  userEmail: string;
  date: Date;
  time: string;
  status: string;
  tradingPair: string;
  amount: number;
  iconUrl: string;
};

function Dashboard() {
  const { username, setUsername, setAvatar } = useUser();
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(true);
  const { isOpen, closeModal } = useProfileModal();
  const navigation = useRouter();
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [totalTradeProfit, setTotalTradeProfit] = useState(0);
  const [totalInvestmentAmount, setTotalInvestmentAmount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsername(user.displayName?.trim() || "");
        setAvatar(user.photoURL);

        // Check if the user is an admin
        if (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
          navigation.push("/admin/invoices");
        } else {
          await fetchTrades();
          await fetchInvestments();
          setLoading(false);
        }
      } else {
        navigation.push("/login");
      }
    });

    return () => unsubscribe();
  }, [navigation, setUsername, setAvatar]);

  const fetchTrades = async () => {
    setLoadingTrades(true);
    try {
      const userEmail = auth.currentUser?.email;
      const tradesCollection = collection(db, "trades");
      const q = query(tradesCollection, where("userEmail", "==", userEmail));
      const tradesSnapshot = await getDocs(q);

      const tradesData = tradesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userEmail: data.userEmail,
          date: new Date(data.date), // Convert string to Date object
          time: data.time,
          status: data.status,
          tradingPair: data.tradingPair,
          amount: data.amount,
          iconUrl: data.iconUrl,
        };
      });
      console.log(tradesData);
      setTrades(tradesData);

      // Calculate total trade profit
      const totalProfit = tradesData.reduce(
        (acc, trade) =>
          acc + (typeof trade.amount === "number" ? trade.amount : 0),
        0
      );
      setTotalTradeProfit(totalProfit);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoadingTrades(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      const userEmail = auth.currentUser?.email;
      const investmentsCollection = collection(db, "investments");
      const investmentsSnapshot = await getDocs(investmentsCollection);

      const investmentsData: Investment[] = investmentsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          userEmail: doc.data().userEmail,
          amount: doc.data().amount,
          date: doc.data().createdAt,
          status: doc.data().status,
        }))
        .filter((investment) => investment.userEmail === userEmail);

      // Calculate total investment amount
      const totalAmount = investmentsData.reduce(
        (acc, investment) => acc + investment.amount,
        0
      );
      console.log(totalAmount, "totalAmount");
      setTotalInvestmentAmount(totalAmount);
    } catch (error) {
      console.error("Error fetching investments:", error);
    }
  };

  const handleOpenDepositModal = () => {
    setDepositModalOpen(true);
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false);
  };

  const handleOpenWithdrawModal = () => {
    setWithdrawModalOpen(true);
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  // Show loading screen while fetching data
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mt-4 flex">
        <div className="w-20 h-20 xl:w-40 xl:h-40 xl:-ml-4 overflow-hidden rounded-full flex items-center justify-center">
          <Avatar
            src={auth.currentUser?.photoURL || "/avatar.svg"}
            alt="User Avatar"
            className="object-cover"
            style={{ width: "120px", height: "120px" }}
          />
        </div>
      </div>

      <h1 style={{ marginTop: "0" }} className="text-light text-2xl font-bold">
        WELCOME BACK TO UTOPIA {username.toUpperCase()}
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 lg:justify-between">
        <div className="flex-grow">
          <p className="text-gray">Your Profits</p>
          {trades.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-light text-2xl lg:text-xl font-bold">
                ${totalTradeProfit ? totalTradeProfit.toFixed(2) : "0.00"} USDT
              </span>
              <Image
                src="/usdt.svg"
                alt="USDT ICON"
                className="inline"
                width={15}
                height={15}
              />
            </div>
          ) : (
            <p className="text-light">You haven&apos;t made any profits yet.</p>
          )}
        </div>

        <div className="flex-grow">
          <p className="text-gray">Investment</p>
          <div className="flex items-center gap-2">
            <span
              className={`text-light ${
                totalInvestmentAmount > 0
                  ? "text-2xl lg:text-xl font-bold"
                  : "text-lg"
              }`}
            >
              {totalInvestmentAmount > 0
                ? `$${totalInvestmentAmount} USDT`
                : "You haven't invested yet."}
            </span>
            {totalInvestmentAmount > 0 && (
              <Image
                src="/usdt.svg"
                alt="USDT ICON"
                className="inline"
                width={15}
                height={15}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-center lg:justify-end gap-4 lg:gap-2 md:w-5/12">
          <Button
            className="flex p-6 lg:w-full items-center gap-2 bg-orange text-light"
            onClick={handleOpenDepositModal}
          >
            <Image
              src="/plusButton.svg"
              alt="Plus Icon"
              width={20}
              height={20}
            />
            Deposit Funds
          </Button>
          <Button
            className="flex p-6 lg:w-full items-center gap-2 bg-gray text-light"
            onClick={handleOpenWithdrawModal}
          >
            <Image
              src="/minusButton.svg"
              alt="Minus Icon"
              width={20}
              height={20}
            />
            Withdraw Funds
          </Button>
        </div>
      </div>
      <hr className="border-gray" />

      <h2 className="text-light text-xl font-bold">Your Profits</h2>

      <History loading={loadingTrades} trades={trades} />

      {isDepositModalOpen && (
        <DepositFundsModal onClose={handleCloseDepositModal} />
      )}
      {isWithdrawModalOpen && (
        <WithdrawCryptoModal onClose={handleCloseWithdrawModal} />
      )}
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
    </Layout>
  );
}

export default function DashboardWithProvider() {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
}
