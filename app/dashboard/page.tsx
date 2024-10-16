"use client";

import { Avatar, Button } from "@nextui-org/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import History from "@/components/History";
import Navbar from "@/components/Navbar";
import Panel from "@/components/Panel";
import {
  ProfileModalProvider,
  useProfileModal,
} from "@/context/ProfileModalContext";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import { useRouter } from "next/navigation";
import { UserProvider, useUser } from '@/context/UserContext'; // Import UserProvider
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import DepositFundsModal from "@/components/DepositFundsModal"; // Import the modal component
import WithdrawCryptoModal from "@/components/WithdrawCryptoModal"; // Import the WithdrawCryptoModal

function Dashboard() {
  const { username, setUsername, setAvatar } = useUser(); // Destructure username, setUsername, and setAvatar from context
  const [loading, setLoading] = useState(true);
  const [userGender, setUserGender] = useState<string | null>(null); // State for gender
  const { isOpen, closeModal } = useProfileModal();
  const navigation = useRouter();
  const user = auth.currentUser; // Get the current user
  const [isDepositModalOpen, setDepositModalOpen] = useState(false); // State for modal visibility
  const [isWithdrawModalOpen, setWithdrawModalOpen] = useState(false); // New state for withdraw modal

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(user);
        setUsername(user.displayName?.trim() || "");
        setAvatar(user.photoURL);
        
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserGender(userData.gender); // Set the gender from Firestore
        }
        
        setLoading(false);
      } else {
        navigation.push("/login");
      }
    });

    return () => unsubscribe();
  }, [navigation, setUsername, setAvatar]); // Ensure setUsername and setAvatar are included in the dependency array

  useEffect(() => {
    console.log("Username updated:", username);
  }, [username]);

  const handleOpenDepositModal = () => {
    setDepositModalOpen(true); // Open the modal
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false); // Close the modal
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
    <div className={`bg-background flex h-screen`}>
      {/* Left Panel for Desktop */}
      <div className={`hidden lg:flex flex-col bg-darker p-4 w-64`}>
        <ProfileModalProvider>
          <Panel />
        </ProfileModalProvider>
      </div>

      {/* Mobile Navbar */}
      <ProfileModalProvider>
        <Navbar />
      </ProfileModalProvider>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col gap-4 pt-10 px-10 lg:p-8 overflow-y-auto`}
      >
        <div className="mt-4 flex">
          <div className="w-20 h-20 xl:w-40 xl:h-40 xl:-ml-4 overflow-hidden rounded-full flex items-center justify-center">
            {/* Display the user's avatar if available */}
            <Avatar
              src={user?.photoURL || "/avatar.svg"} // Use the user's photoURL or a placeholder
              alt="User Avatar"
              className="object-cover" // Ensure the image covers the area
              style={{ width: "120px", height: "120px" }} // Set fixed dimensions for a perfect circle
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

        {/* Conditionally render the DepositFundsModal */}
        {isDepositModalOpen && <DepositFundsModal onClose={handleCloseDepositModal} />}

        {/* Conditionally render the WithdrawCryptoModal */}
        {isWithdrawModalOpen && <WithdrawCryptoModal onClose={handleCloseWithdrawModal} />}
      </main>

      {/* Conditionally render the ProfileSettingsModal based on isOpen state and username */}
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
    </div>
  );
}

// Wrap the Dashboard component with UserProvider
export default function DashboardWithProvider() {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
}
