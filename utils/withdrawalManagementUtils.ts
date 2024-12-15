import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    runTransaction,
    setDoc,
    startAfter,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 50;

type Withdrawal = {
  id: string;
  userEmail: string;
  username: string;
  amount: number;
  date: Timestamp;
  status: "pending" | "confirmed";
  withdrawalId?: string;
}

type WithdrawalRequest = {
  id: string;
  userEmail: string;
  username: string;
  amount: number;
  date: Timestamp;
  status: "pending" | "confirmed";
  address: string;
  withdrawalId: string;
  userId: string;
}

type SetState<T> = Dispatch<SetStateAction<T>>;

export const listenToWithdrawals = (
  setWithdrawals: SetState<Withdrawal[]>,
  setLastVisibleWithdrawal: SetState<QueryDocumentSnapshot<DocumentData> | null>,
  setTotalWithdrawalPages: SetState<number>,
  setLoading: SetState<boolean>,
  setError: SetState<string | null>
) => {
  const withdrawalsRef = collection(db, "withdrawals");
  const q = query(
    withdrawalsRef,
    orderBy("date", "desc"),
    limit(ITEMS_PER_PAGE)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const withdrawalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Withdrawal[];
      setWithdrawals(withdrawalsData);
      setLastVisibleWithdrawal(snapshot.docs[snapshot.docs.length - 1]);
      setTotalWithdrawalPages(Math.ceil(snapshot.size / ITEMS_PER_PAGE));
      setLoading(false);
    },
    (error) => {
      console.error("Error fetching withdrawals:", error);
      setError("Error fetching withdrawals. Please try again later.");
      setLoading(false);
    }
  );
};

export const listenToWithdrawalRequests = (
  setWithdrawalRequests: SetState<WithdrawalRequest[]>,
  setLastVisibleRequest: SetState<QueryDocumentSnapshot<DocumentData> | null>,
  setTotalRequestPages: SetState<number>,
  setLoading: SetState<boolean>,
  setError: SetState<string | null>
) => {
  const requestsRef = collection(db, "withdrawalRequests");
  const q = query(requestsRef, orderBy("date", "desc"), limit(ITEMS_PER_PAGE));

  return onSnapshot(
    q,
    (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        userId: doc.data().userId,
      })) as WithdrawalRequest[];
      setWithdrawalRequests(requestsData);
      setLastVisibleRequest(snapshot.docs[snapshot.docs.length - 1]);
      setTotalRequestPages(Math.ceil(snapshot.size / ITEMS_PER_PAGE));
      setLoading(false);
    },
    (error) => {
      console.error("Error fetching withdrawal requests:", error);
      setError("Error fetching withdrawal requests. Please try again later.");
      setLoading(false);
    }
  );
};

export const fetchMoreWithdrawals = async (
  lastDoc: QueryDocumentSnapshot<DocumentData>,
  setWithdrawals: SetState<Withdrawal[]>,
  setLastVisibleWithdrawal: SetState<QueryDocumentSnapshot<DocumentData> | null>
) => {
  const withdrawalsRef = collection(db, "withdrawals");
  const q = query(
    withdrawalsRef,
    orderBy("date", "desc"),
    startAfter(lastDoc),
    limit(ITEMS_PER_PAGE)
  );

  try {
    const snapshot = await getDocs(q);
    const newWithdrawals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Withdrawal[];
    setWithdrawals((prevWithdrawals) => [
      ...prevWithdrawals,
      ...newWithdrawals,
    ]);
    setLastVisibleWithdrawal(snapshot.docs[snapshot.docs.length - 1]);
  } catch (error) {
    console.error("Error fetching more withdrawals:", error);
    toast.error("Error fetching more withdrawals. Please try again.");
  }
};

export const fetchMoreWithdrawalRequests = async (
  lastDoc: QueryDocumentSnapshot<DocumentData>,
  setWithdrawalRequests: SetState<WithdrawalRequest[]>,
  setLastVisibleRequest: SetState<QueryDocumentSnapshot<DocumentData> | null>
) => {
  const requestsRef = collection(db, "withdrawalRequests");
  const q = query(
    requestsRef,
    orderBy("date", "desc"),
    startAfter(lastDoc),
    limit(ITEMS_PER_PAGE)
  );

  try {
    const snapshot = await getDocs(q);
    const newRequests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WithdrawalRequest[];
    setWithdrawalRequests((prevRequests) => [
      ...prevRequests,
      ...newRequests,
    ]);
    setLastVisibleRequest(snapshot.docs[snapshot.docs.length - 1]);
  } catch (error) {
    console.error("Error fetching more withdrawal requests:", error);
    toast.error("Error fetching more withdrawal requests. Please try again.");
  }
};
/*
 requestId: string,
  withdrawalId: string,
  newStatus: "confirmed" | "pending",
  isConfirmation: boolean
*/
export const handleUpdateStatus = async (_requestData: WithdrawalRequest, isConfirmed: boolean) => {
  try {
    console.log("Request ID:", _requestData.id, "Withdrawal ID:", _requestData.withdrawalId)
    const requestRef = doc(db, "withdrawalRequests", _requestData.id);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      throw new Error("Request not found");
    }
    // const requestData = requestDoc.data() as WithdrawalRequest;

    await confirmWithdrawal(_requestData)

    await runTransaction(db, async (transaction) => {
      const withdrawalRef = doc(db, "withdrawals", _requestData.withdrawalId);
      const withdrawalDoc = await transaction.get(withdrawalRef);

      if (!withdrawalDoc.exists()) {
        throw new Error("Withdrawal not found");
      }

      const withdrawalData = withdrawalDoc.data();
      console.log("WithdrawalData", withdrawalData)
      if (isConfirmed) {
        const profitRef = doc(db, "profits", _requestData.userEmail);
        const profitDoc = await transaction.get(profitRef);

        if (!profitDoc.exists()) {
          throw new Error("Profit document not found");
        }

        const currentProfit = profitDoc.data().profit || 0;
        transaction.update(profitRef, { profit: currentProfit - _requestData.amount });
      }

      transaction.update(withdrawalRef, { status: "confirmed" });
      transaction.update(requestRef, { status: "confirmed" });

      const withdrawalDataWithStatus = {
        ...withdrawalData,
        status: "confirmed",
        withdrawalId: _requestData.withdrawalId,
      };

      transaction.set(withdrawalRef, withdrawalDataWithStatus);
    });

    toast.success(`Withdrawal ${isConfirmed ? "confirmed" : "updated"} successfully`);
  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    toast.error("Failed to update withdrawal status");
  }
};

const deductFromUserWallet = async (userEmail: string, amount: number) => {
  const walletDocRef = doc(db, "wallets", userEmail);
  try {
    const walletDoc = await getDoc(walletDocRef);
    const currentBalance = walletDoc.data()?.balance;

    if (currentBalance >= amount) {
      await updateDoc(walletDocRef, { balance: currentBalance - amount });
      toast.success("Amount deducted from user wallet.");
    } else {
      throw new Error("Insufficient balance.");
    }
  } catch (error) {
    console.error("Error deducting from user wallet:", error);
    toast.error("Error deducting from user wallet. Please try again.");
  }
};

export const handleSearch = async (
  searchByWithdrawalId: boolean,
  searchInput: string,
  setWithdrawals: SetState<Withdrawal[]>,
  setWithdrawalRequests: SetState<WithdrawalRequest[]>,
  setLoading: SetState<boolean>,
  setError: SetState<string | null>
) => {
  setLoading(true);
  setError(null);

  const withdrawalsRef = collection(db, "withdrawals");
  const requestsRef = collection(db, "withdrawalRequests");

  let withdrawalsQuery, requestsQuery;

  if (searchByWithdrawalId) {
    withdrawalsQuery = query(
      withdrawalsRef,
      where("withdrawalId", "==", searchInput)
    );
    requestsQuery = query(
      requestsRef,
      where("withdrawalId", "==", searchInput)
    );
  } else {
    withdrawalsQuery = query(
      withdrawalsRef,
      where("userEmail", "==", searchInput)
    );
    requestsQuery = query(requestsRef, where("userEmail", "==", searchInput));
  }

  try {
    const [withdrawalsSnapshot, requestsSnapshot] = await Promise.all([
      getDocs(withdrawalsQuery),
      getDocs(requestsQuery),
    ]);

    const withdrawalsData = withdrawalsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Withdrawal[];
    const requestsData = requestsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WithdrawalRequest[];

    setWithdrawals(withdrawalsData);
    setWithdrawalRequests(requestsData);
    setLoading(false);

    if (withdrawalsData.length === 0 && requestsData.length === 0) {
      toast.info("No results found");
    }
  } catch (error) {
    console.error("Error searching:", error);
    setError("Error searching. Please try again later.");
    setLoading(false);
  }
};

export const confirmWithdrawal = async (requestData: WithdrawalRequest) => {
  const withdrawalData = {
    userEmail: requestData.userEmail,
    username: requestData.username,
    amount: requestData.amount,
    date: Timestamp.now(),
    status: "confirmed",
    withdrawalId: requestData.withdrawalId,
    address: requestData.address,
  };

  await setDoc(
    doc(db, "withdrawals", requestData.withdrawalId),
    withdrawalData
  );
  // await deductFromUserWallet(requestData.userEmail, requestData.amount);
};

export const revertWithdrawal = async (withdrawalId: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      const withdrawalRef = doc(db, "withdrawals", withdrawalId);
      const withdrawalDoc = await transaction.get(withdrawalRef);

      if (!withdrawalDoc.exists()) {
        throw new Error("Withdrawal not found");
      }

      const withdrawalData = withdrawalDoc.data();
      const { userEmail, amount } = withdrawalData;

      const requestsRef = collection(db, "withdrawalRequests");
      const requestQuery = query(requestsRef, where("withdrawalId", "==", withdrawalId));
      const requestSnapshot = await getDocs(requestQuery);

      if (requestSnapshot.empty) {
        throw new Error("Corresponding withdrawal request not found");
      }

      const requestDoc = requestSnapshot.docs[0];

      const profitRef = doc(db, "profits", userEmail);
      const profitDoc = await transaction.get(profitRef);

      if (!profitDoc.exists()) {
        throw new Error("Profit document not found");
      }

      const currentProfit = profitDoc.data().profit || 0;
      transaction.update(profitRef, { profit: currentProfit + amount });

      transaction.delete(withdrawalRef);

      transaction.update(requestDoc.ref, { status: "pending" });
    });

    toast.success("Withdrawal reverted successfully");
  } catch (error) {
    console.error("Error reverting withdrawal:", error);
    toast.error("Failed to revert withdrawal");
  }
};
