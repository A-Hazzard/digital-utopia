"use client";

import { Avatar, Button } from "@nextui-org/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import History from "@/components/History";
import { useProfileModal } from "@/context/ProfileModalContext";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import { useRouter } from "next/navigation";
import { UserProvider, useUser } from '@/context/UserContext';
import { doc, getDoc } from "firebase/firestore";
import DepositFundsModal from "@/components/DepositFundsModal";
import WithdrawCryptoModal from "@/components/WithdrawCryptoModal";
import Layout from "@/app/common/Layout";

function Dashboard() {
  const { username, setUsername, setAvatar } = useUser(); 
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState<string | null>(null);
  const { isOpen, closeModal } = useProfileModal();
  const navigation = useRouter();
  const user = auth.currentUser; 
  const [isDepositModalOpen, setDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsername(user.displayName?.trim() || ""); 
        setAvatar(user.photoURL);
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserGender(userData.gender);
        }
        
        setLoading(false);
      } else {
        navigation.push("/login");
      }
    });

    return () => unsubscribe();
  }, [navigation, setUsername, setAvatar]);

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
        {userGender === "male"
          ? `WELCOME BACK TO UTOPIA Mr. ${username}.`
          : userGender === "female"
          ? `WELCOME BACK TO UTOPIA Ms. ${username}.`
          : `WELCOME BACK TO UTOPIA ${username}.`}
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 lg:justify-between">
        <div className="flex-grow">
          <p className="text-gray">Your Profits</p>
          <div className="flex items-center gap-2">
            <span className="text-light text-2xl lg:text-xl font-bold">
              $40,000 USDT
            </span>
            <Image
              src="/usdt.svg"
              alt="USDT ICON"
              className="inline"
              width={15}
              height={15}
            />
          </div>
          <div className="flex items-center gap-2">
            <Image
              src="/uptrend.svg"
              alt="Uptrend Icon"
              width={20}
              height={20}
            />
            <p className="text-[#00BA3E]">+6.9%</p>
            <p className="text-gray">past month</p>
          </div>
        </div>

        <div className="flex-grow">
          <p className="text-gray">Investment</p>
          <div className="flex items-center gap-2">
            <span className="text-light text-2xl lg:text-xl font-bold">
              $10,000 USDT
            </span>
            <Image
              src="/usdt.svg"
              alt="USDT ICON"
              className="inline"
              width={15}
              height={15}
            />
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

      <History />

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
