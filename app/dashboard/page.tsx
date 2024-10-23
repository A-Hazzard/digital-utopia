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
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "../../lib/firebase";

type Trade = {
  id: string;
  userEmail: string;
  date: Timestamp;
  time: string;
  status: string;
  tradingPair: string;
  amount: number;
  iconUrl: string;
  type: string;
};

type Wallet = {
  balance: number;
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
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasConfirmedInvoice, setHasConfirmedInvoice] = useState(false);
  const [hasPendingWithdrawal, setHasPendingWithdrawal] = useState(false);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null); // New state for pending withdrawal ID
  const [hasPendingDeposit, setHasPendingDeposit] = useState(false); // New state for pending deposit
  const [pendingDepositId, setPendingDepositId] = useState<string | null>(null); // New state for pending deposit ID

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsername(user.displayName?.trim() || "");
        setAvatar(user.photoURL);

        // Check if the user is an admin
        if (
          user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL1 ||
          user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL2 ||
          user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL3
        ) {
          navigation.push("/admin/invoices");
        } else {
          await fetchTrades();
          listenToWalletChanges(user.email);
          checkConfirmedInvoice(user.email);
          listenToPendingWithdrawals(user.email); // Listen for pending withdrawals
          listenToPendingDeposits(user.email); // Listen for pending deposits
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

      const tradesData = tradesSnapshot.docs.map(
        (doc: QueryDocumentSnapshot) => {
          const data = doc.data();
          return {
            id: doc.id,
            userEmail: data.userEmail,
            date: data.date,
            time: data.time,
            status: data.status,
            tradingPair: data.tradingPair,
            amount: parseFloat(data.amount),
            iconUrl: data.iconUrl,
            type: data.type,
          };
        }
      );
      console.log("Fetched trades:", tradesData);
      setTrades(tradesData);

      // Calculate total trade profit
      const totalProfit = tradesData.reduce((acc, trade) => {
        return trade.type === "win" ? acc + trade.amount : acc - trade.amount;
      }, 0);
      console.log("Calculated total profit:", totalProfit);
      setTotalTradeProfit(totalProfit);
    } catch (error) {
      console.error("Error fetching trades:", error);
    } finally {
      setLoadingTrades(false);
    }
  };

  const listenToWalletChanges = (userEmail: string | null) => {
    if (!userEmail) return;

    const walletRef = doc(db, "wallets", userEmail);
    return onSnapshot(
      walletRef,
      (doc) => {
        if (doc.exists()) {
          const walletData = doc.data() as Wallet;
          setWalletBalance(walletData.balance || 0);
        } else {
          setWalletBalance(0);
        }
      },
      (error) => {
        console.error("Error listening to wallet changes:", error);
      }
    );
  };

  const checkConfirmedInvoice = async (userEmail: string | null) => {
    if (!userEmail) return;

    const invoicesCollection = collection(db, "invoices");
    const q = query(
      invoicesCollection,
      where("userEmail", "==", userEmail),
      where("status", "==", "paid")
    );

    const querySnapshot = await getDocs(q);
    setHasConfirmedInvoice(!querySnapshot.empty);
  };

  const listenToPendingWithdrawals = (userEmail: string | null) => {
    if (!userEmail) return;

    const withdrawalRequestsCollection = collection(db, "withdrawalRequests");
    const q = query(
      withdrawalRequestsCollection,
      where("userEmail", "==", userEmail),
      where("status", "==", "pending")
    );

    return onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const pendingRequest = querySnapshot.docs[0].data();
        setHasPendingWithdrawal(true);
        setPendingWithdrawalId(pendingRequest.withdrawalId); // Set the pending withdrawal ID
      } else {
        setHasPendingWithdrawal(false);
        setPendingWithdrawalId(null); // Reset if no pending requests
      }
    });
  };

  const listenToPendingDeposits = (userEmail: string | null) => {
    if (!userEmail) return;

    const depositsCollection = collection(db, "deposits");
    const q = query(
      depositsCollection,
      where("userEmail", "==", userEmail),
      where("status", "==", "pending")
    );

    return onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const pendingDeposit = querySnapshot.docs[0].data();
        setHasPendingDeposit(true);
        setPendingDepositId(pendingDeposit.transactionId); // Set the pending deposit ID
      } else {
        setHasPendingDeposit(false);
        setPendingDepositId(null); // Reset if no pending deposits
      }
    });
  };

  const handleOpenDepositModal = () => {
    if (hasConfirmedInvoice && !hasPendingDeposit) {
      setDepositModalOpen(true);
    } else {
      toast.error(
        "Please pay your monthly subscription via the invoices page before depositing funds or resolve your pending deposit."
      );
    }
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false);
  };

  const handleOpenWithdrawModal = () => {
    if (hasConfirmedInvoice && !hasPendingWithdrawal) {
      setWithdrawModalOpen(true);
    } else {
      toast.error(
        "Please pay your monthly subscription via the invoices page before withdrawing funds."
      );
    }
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  const handleCancelWithdrawal = async () => {
    if (!pendingWithdrawalId) return; // Ensure pendingWithdrawalId is available

    try {
      // Query the withdrawalRequests collection to find the document
      const userEmail = auth.currentUser?.email;
      const requestsCollection = collection(db, "withdrawalRequests");
      const q = query(
        requestsCollection,
        where("userEmail", "==", userEmail),
        where("withdrawalId", "==", pendingWithdrawalId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If a matching document is found, delete it
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, "withdrawalRequests", docToDelete.id)); // Delete the withdrawal request
        toast.success("Withdrawal request cancelled successfully.");
      } else {
        toast.error("No matching withdrawal request found.");
      }
    } catch (error) {
      console.error("Error cancelling withdrawal:", error);
      toast.error("Failed to cancel withdrawal request.");
    }
  };

  const handleCancelDeposit = async () => {
    if (!pendingDepositId) return; // Ensure pendingDepositId is available

    try {
      // Query the deposits collection to find the document
      const userEmail = auth.currentUser?.email;
      const depositsCollection = collection(db, "deposits");
      const q = query(
        depositsCollection,
        where("userEmail", "==", userEmail),
        where("transactionId", "==", pendingDepositId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If a matching document is found, delete it
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, "deposits", docToDelete.id)); // Delete the deposit request
        toast.success("Deposit request cancelled successfully.");
      } else {
        toast.error("No matching deposit request found.");
      }
    } catch (error) {
      console.error("Error cancelling deposit:", error);
      toast.error("Failed to cancel deposit request.");
    }
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
      <ToastContainer />
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
        WELCOME TO UTOPIA {username.toUpperCase()}
      </h1>

      <div className="flex flex-col lg:flex-row gap-4 lg:justify-between">
        <div className="flex-grow">
          <p className="text-gray">Your Profits</p>
          {trades.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-light text-2xl lg:text-xl font-bold">
                ${totalTradeProfit.toFixed(2)} USDT
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
            <div className="flex items-center gap-2">
              <span className="text-light text-2xl lg:text-xl font-bold">
                $0.00 USDT
              </span>
              <Image
                src="/usdt.svg"
                alt="USDT ICON"
                className="inline"
                width={15}
                height={15}
              />
            </div>
          )}
        </div>

        <div className="flex-grow">
          <p className="text-gray">Wallet Balance</p>
          <div className="flex items-center gap-2">
            <span className="text-light text-2xl lg:text-xl font-bold">
              ${walletBalance.toFixed(2)} USDT
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
          <Button
            className={`flex p-4 lg:w-full items-center gap-2 ${
              hasConfirmedInvoice && !hasPendingDeposit
                ? "bg-orange text-light"
                : "bg-gray text-dark cursor-not-allowed"
            }`}
            onClick={handleOpenDepositModal}
            disabled={hasPendingDeposit}
          >
            <Image
              src="/plusButton.svg"
              alt="Plus Icon"
              width={24}
              height={24}
            />
            Deposit Funds
          </Button>
          <div className="flex flex-col">
            <Button
              className={`flex p-4 lg:w-full items-center gap-2 ${
                hasConfirmedInvoice && !hasPendingWithdrawal
                  ? "bg-orange text-light"
                  : "bg-gray text-dark cursor-not-allowed"
              }`}
              onClick={handleOpenWithdrawModal}
              disabled={!hasConfirmedInvoice || hasPendingWithdrawal}
            >
              <Image
                src="/minusButton.svg"
                alt="Minus Icon"
                width={24}
                height={24}
              />
              Withdraw Funds
            </Button>
            {!hasConfirmedInvoice && (
              <p className="text-red-500 text-sm mt-2">
                Please pay your monthly subscription via the invoices page
                before depositing or withdrawing funds.
              </p>
            )}
            {hasPendingWithdrawal && (
              <div className="flex flex-col">
                <p className="text-red-500 text-sm mt-2">
                  You have a pending withdrawal request. Please wait for it to be confirmed before making another request.
                </p>
                <Button
                  className="bg-red-600 text-white mt-2"
                  onClick={handleCancelWithdrawal}
                >
                  Cancel Withdrawal
                </Button>
              </div>
            )}
            {hasPendingDeposit && (
              <div className="flex flex-col">
                <p className="text-red-500 text-sm mt-2">
                  You have a pending deposit request. Please wait for it to be confirmed before making another deposit.
                </p>
                <Button
                  className="bg-red-600 text-white mt-2"
                  onClick={handleCancelDeposit} // Call the cancel deposit function
                >
                  Cancel Deposit
                </Button>
              </div>
            )}
          </div>
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
