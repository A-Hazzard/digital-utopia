"use client";

import Layout from "@/app/common/Layout";
import DepositFundsModal from "@/components/DepositFundsModal";
import History from "@/components/History";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import WithdrawCryptoModal from "@/components/WithdrawCryptoModal";
import { useProfileModal } from "@/context/ProfileModalContext";
import { UserProvider, useUser } from "@/context/UserContext";
import { auth, db } from "@/lib/firebase";
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
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(
    null
  );
  const [hasPendingDeposit, setHasPendingDeposit] = useState(false);
  const [pendingDepositId, setPendingDepositId] = useState<string | null>(null);
  const [hasPendingInvoice, setHasPendingInvoice] = useState(false);
 
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsername(user.displayName?.trim() || "");
        setAvatar(user.photoURL);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const isAdmin = userDoc.data().isAdmin;

          if (isAdmin) {
            navigation.push("/admin/invoices");
          } else {
            listenToTrades(user.email);
            listenToProfit(user.email);
            listenToWalletChanges(user.email);
            checkConfirmedInvoice(user.email);
            listenToPendingWithdrawals(user.email);
            listenToPendingDeposits(user.email);
            listenToPendingInvoices(user.email);
            setLoading(false);
          }
        } else {
          console.error("User document not found");
          navigation.push("/login");
        }
      } else {
        navigation.push("/login");
      }
    });

    return () => unsubscribe();
  }, [navigation, setUsername, setAvatar]);

  const listenToTrades = (userEmail: string | null) => {
    if (!userEmail) return;

    const tradesCollection = collection(db, "trades");
    const q = query(tradesCollection, where("userEmail", "==", userEmail));

    return onSnapshot(
      q,
      (snapshot) => {
        const tradesData = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
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
        });
        setTrades(tradesData);
        setLoadingTrades(false);
      },
      (error) => {
        console.error("Error listening to trades:", error);
        setLoadingTrades(false);
      }
    );
  };

  const listenToProfit = (userEmail: string | null) => {
    if (!userEmail) return;

    const profitRef = doc(db, "profits", userEmail);

    return onSnapshot(
      profitRef,
      (doc) => {
        if (doc.exists()) {
          const profitData = doc.data();
          setTotalTradeProfit(profitData.profit || 0);
        } else {
          setTotalTradeProfit(0);
        }
      },
      (error) => {
        console.error("Error listening to profit:", error);
      }
    );
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
        setPendingWithdrawalId(pendingRequest.withdrawalId);
      } else {
        setHasPendingWithdrawal(false);
        setPendingWithdrawalId(null);
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
        setPendingDepositId(pendingDeposit.transactionId);
      } else {
        setHasPendingDeposit(false);
        setPendingDepositId(null);
      }
    });
  };

  const listenToPendingInvoices = (userEmail: string | null) => {
    if (!userEmail) return;

    const invoicesCollection = collection(db, "invoices");
    const q = query(
      invoicesCollection,
      where("userEmail", "==", userEmail),
      where("status", "==", "pending")
    );

    return onSnapshot(q, (querySnapshot) => {
      setHasPendingInvoice(!querySnapshot.empty);
    });
  };

  const handleOpenDepositModal = () => {
    if (hasConfirmedInvoice && !hasPendingDeposit && !hasPendingInvoice) {
      setDepositModalOpen(true);
    } else {
      toast.error(
        "Please pay your monthly subscription and any pending invoices before depositing funds or resolve your pending deposit."
      );
    }
  };

  const handleCloseDepositModal = () => {
    setDepositModalOpen(false);
  };

  const handleOpenWithdrawModal = () => {
    if (hasConfirmedInvoice && !hasPendingWithdrawal && !hasPendingInvoice) {
      setWithdrawModalOpen(true);
    } else {
      toast.error(
        "Please pay your monthly subscription and any pending invoices before withdrawing funds."
      );
    }
  };

  const handleCloseWithdrawModal = () => {
    setWithdrawModalOpen(false);
  };

  const handleCancelWithdrawal = async () => {
    if (!pendingWithdrawalId) return;

    try {
      const userEmail = auth.currentUser?.email;
      const requestsCollection = collection(db, "withdrawalRequests");
      const q = query(
        requestsCollection,
        where("userEmail", "==", userEmail),
        where("withdrawalId", "==", pendingWithdrawalId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, "withdrawalRequests", docToDelete.id));
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
    if (!pendingDepositId) return;

    try {
      const userEmail = auth.currentUser?.email;
      const depositsCollection = collection(db, "deposits");
      const q = query(
        depositsCollection,
        where("userEmail", "==", userEmail),
        where("transactionId", "==", pendingDepositId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docToDelete = querySnapshot.docs[0];
        await deleteDoc(doc(db, "deposits", docToDelete.id));
        toast.success("Deposit request cancelled successfully.");
      } else {
        toast.error("No matching deposit request found.");
      }
    } catch (error) {
      console.error("Error cancelling deposit:", error);
      toast.error("Failed to cancel deposit request.");
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
    );
  }

  return (
    <Layout>
      <div className="2xl:w-7/12 2xl:mx-auto">
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
          <p className="text-gray my-2">Your Profits</p>
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
        </div>

        <div className="flex-grow">
          <p className="text-gray my-2">Wallet Balance</p>
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
            className={`flex items-center gap-2 px-6 py-4 min-w-[180px] justify-center ${
              hasConfirmedInvoice && !hasPendingDeposit && !hasPendingInvoice
                ? "bg-orange text-light hover:bg-orange/90"
                : "bg-gray text-dark opacity-70"
            }`}
            onClick={handleOpenDepositModal}
            disabled={!hasConfirmedInvoice || hasPendingDeposit || hasPendingInvoice}
          >
            <Image
              src="/plusButton.svg"
              alt="Plus Icon"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            Deposit Funds
          </Button>
          <div className="flex flex-col">
            <Button
              className={`flex items-center gap-2 px-6 py-4 min-w-[180px] justify-center ${
                hasConfirmedInvoice && !hasPendingWithdrawal && !hasPendingInvoice
                  ? "bg-orange text-light hover:bg-orange/90"
                  : "bg-gray text-dark opacity-70"
              }`}
              onClick={handleOpenWithdrawModal}
              disabled={!hasConfirmedInvoice || hasPendingWithdrawal || hasPendingInvoice}
            >
              <Image
                src="/minusButton.svg"
                alt="Minus Icon"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              Withdraw Funds
            </Button>
            {!hasConfirmedInvoice || hasPendingInvoice && (
              <p className="text-red-500 text-sm mt-2">
                {hasPendingInvoice 
                  ? "You have pending invoices. Please pay them before depositing or withdrawing funds."
                  : "Please pay your monthly subscription via the invoices page before depositing or withdrawing funds."}
              </p>
            )}
            {hasPendingWithdrawal && (
              <div className="flex flex-col">
                <p className="text-red-500 text-sm mt-2">
                  You have a pending withdrawal request. Please wait for it to be confirmed before making another request.
                </p>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700 mt-2 px-6 py-3"
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
                  className="bg-red-600 text-white hover:bg-red-700 mt-2 px-6 py-3"
                  onClick={handleCancelDeposit} 
                >
                  Cancel Deposit
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <hr className="border-gray my-4" />

      <h2 className="text-light text-xl my-4 font-bold">Your Profits</h2>

      <History loading={loadingTrades} trades={trades} />

      {isDepositModalOpen && (
        <DepositFundsModal onClose={handleCloseDepositModal} />
      )}
      {isWithdrawModalOpen && (
        <WithdrawCryptoModal onClose={handleCloseWithdrawModal} />
      )}
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
      </div>
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
