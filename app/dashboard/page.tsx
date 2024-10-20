"use client";

import Layout from "@/app/common/Layout";
import DepositFundsModal from "@/components/DepositFundsModal";
import History from "@/components/History";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import WithdrawCryptoModal from "@/components/WithdrawCryptoModal";
import { useProfileModal } from "@/context/ProfileModalContext";
import { UserProvider, useUser } from '@/context/UserContext';
import { Avatar, Button } from "@nextui-org/react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";

type Profit = {
  id: string;
  userEmail: string;
  date: Date;
  time: string;
  status: string;
  pair: string;
  profitAmount: number;
}

type Investment = {
  id: string;
  userEmail: string;
  amount: number;
  date: Date;
  status: string;
}

function Dashboard() {
  const { username, setUsername, setAvatar } = useUser(); 
  const [loading, setLoading] = useState(true);
  const [profits, setProfits] = useState<Profit[]>([]);
  const [loadingProfits, setLoadingProfits] = useState(true);
  const { isOpen, closeModal } = useProfileModal();
  const navigation = useRouter();
  const user = auth.currentUser; 
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsername(user.displayName?.trim() || ""); 
        setAvatar(user.photoURL);
        await fetchProfits();
        setLoading(false);
      } else {
        navigation.push("/login");
      }
    });

    return () => unsubscribe();
  }, [navigation, setUsername, setAvatar]);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchProfits = async () => {
    setLoadingProfits(true);
    try {
      const userEmail = auth.currentUser?.email;
      const profitsCollection = collection(db, "profits");
      const profitsSnapshot = await getDocs(profitsCollection);
      
      const profitsData: Profit[] = profitsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          userEmail: doc.data().userEmail,
          date: doc.data().date.toDate(),
          time: doc.data().date.toDate().toLocaleTimeString(),
          status: doc.data().status,
          pair: doc.data().pair,
          profitAmount: doc.data().profitAmount,
        }))
        .filter(profit => profit.userEmail === userEmail);

      setProfits(profitsData);
    } catch (error) {
      console.error("Error fetching profits:", error);
    } finally {
      setLoadingProfits(false);
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

  const fetchInvestments = async () => {
    try {
      const userEmail = auth.currentUser?.email;
      const investmentsCollection = collection(db, "investments");
      const investmentsSnapshot = await getDocs(investmentsCollection);
      
      const investmentsData: Investment[] = investmentsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          userEmail: doc.data().userEmail,
          amount: doc.data().amount,
          date: doc.data().date.toDate(),
          status: doc.data().status,
        }))
        .filter(investment => investment.userEmail === userEmail);

      setInvestments(investmentsData);
    } catch (error) {
      console.error("Error fetching investments:", error);
    } 
  };

  if (loading && !username) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <Layout>
      <div className="mt-4 flex">
        <div className="w-20 h-20 xl:w-40 xl:h-40 xl:-ml-4 overflow-hidden rounded-full flex items-center justify-center">
          <Avatar
            src={user?.photoURL || "/avatar.svg"}
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
          {profits.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-light text-2xl lg:text-xl font-bold">
                ${profits.reduce((acc, profit) => acc + profit.profitAmount, 0)} USDT
              </span>
              <Image
                src="/usdt.svg"
                alt="USDT ICON"
                className="inline"
                width={15}
                height={15}
              />
            </div>
          ): (
            <p className="text-light">You haven&apos;t made any profits yet.</p>
          )}
        </div>

        <div className="flex-grow">
          <p className="text-gray">Investment</p>
          <div className="flex items-center gap-2">
            <span className={`text-light ${investments.length > 0 ? 'text-2xl lg:text-xl font-bold' : 'text-lg'}`}>
              {investments.length > 0 
                ? `$${investments.reduce((acc, investment) => acc + investment.amount, 0)} USDT` 
                : "You haven't invested yet."}
            </span>
            {investments.length > 0 && <Image
              src="/usdt.svg"
              alt="USDT ICON"
              className="inline"
              width={15}
                height={15}
              />}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-center lg:justify-end gap-4 lg:gap-2 md:w-5/12">
          <Button className="flex p-6 lg:w-full items-center gap-2 bg-orange text-light" onClick={handleOpenDepositModal}>
            <Image
              src="/plusButton.svg"
              alt="Plus Icon"
              width={20}
              height={20}
            />
            Deposit Funds
          </Button>
          <Button className="flex p-6 lg:w-full items-center gap-2 bg-gray text-light" onClick={handleOpenWithdrawModal}>
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

      <History profits={profits} loading={loadingProfits} />

      {isDepositModalOpen && <DepositFundsModal onClose={handleCloseDepositModal} />}
      {isWithdrawModalOpen && <WithdrawCryptoModal onClose={handleCloseWithdrawModal} />}
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
