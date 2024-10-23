import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  DocumentData,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";

const ITEMS_PER_PAGE = 50;

interface Withdrawal {
  id: string;
  userEmail: string;
  username: string;
  amount: number;
  date: Timestamp;
  status: "pending" | "confirmed";
  withdrawalId?: string;
}

interface WithdrawalRequest {
  id: string;
  userEmail: string;
  username: string;
  amount: number;
  date: Timestamp;
  status: "pending" | "confirmed";
  address: string;
  withdrawalId: string;
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
    setWithdrawalRequests((prevRequests) => [...prevRequests, ...newRequests]);
    setLastVisibleRequest(snapshot.docs[snapshot.docs.length - 1]);
  } catch (error) {
    console.error("Error fetching more withdrawal requests:", error);
    toast.error("Error fetching more withdrawal requests. Please try again.");
  }
};

export const handleUpdateStatus = async (
  id: string,
  newStatus: "pending" | "confirmed",
  isRequest: boolean = false
) => {
  const docRef = doc(db, isRequest ? "withdrawalRequests" : "withdrawals", id);

  try {
    if (newStatus === "confirmed" && isRequest) {
      const requestDoc = await getDoc(docRef);
      const requestData = requestDoc.data();

      if (!requestData) {
        throw new Error("Request data is undefined");
      }

      const withdrawalData = {
        userEmail: requestData.userEmail,
        username: requestData.username,
        amount: requestData.amount,
        date: Timestamp.now(),
        status: "confirmed",
        withdrawalId: requestData.withdrawalId, // Use withdrawalId as the document ID
        address: requestData.address,
      };

      // Save the document with withdrawalId as the document ID
      await setDoc(doc(db, "withdrawals", requestData.withdrawalId), withdrawalData);
      await deductFromUserWallet(requestData.userId, requestData.amount);
    } else if (newStatus === "pending" && !isRequest) {
      const requestDoc = await getDoc(docRef);
      const requestData = requestDoc.data();

      if (requestData) {
        // Delete the withdrawal document using withdrawalId
        const withdrawalDocRef = doc(db, "withdrawals", requestData.withdrawalId);
        await deleteDoc(withdrawalDocRef);
        toast.success("Withdrawal reverted and deleted.");
      } else {
        toast.error("No matching withdrawal found to revert.");
      }
    }

    // Update the withdrawal request status to pending
    await updateDoc(docRef, { status: newStatus });
    toast.success(`Status updated to ${newStatus}`);
  } catch (error) {
    console.error("Error updating status:", error);
    toast.error("Error updating status. Please try again.");
  }
};

const deductFromUserWallet = async (userId: string, amount: number) => {
  const userDocRef = doc(db, "users", userId);
  try {
    const userDoc = await getDoc(userDocRef);
    const currentBalance = userDoc.data()?.balance;

    if (currentBalance >= amount) {
      await updateDoc(userDocRef, { balance: currentBalance - amount });
      toast.success("Amount deducted from user wallet.");
    } else {
      throw new Error("Insufficient balance.");
    }
  } catch (error) {
    console.error("Error deducting from user wallet:", error);
    toast.error("Error deducting from user wallet. Please try again.");
  }
};

const addToUserWallet = async (userId: string, amount: number) => {
  const userDocRef = doc(db, "users", userId);
  try {
    const userDoc = await getDoc(userDocRef);
    const currentBalance = userDoc.data()?.balance || 0;

    await updateDoc(userDocRef, { balance: currentBalance + amount });
    toast.success("Amount added back to user wallet.");
  } catch (error) {
    console.error("Error adding to user wallet:", error);
    toast.error("Error adding to user wallet. Please try again.");
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

export const confirmWithdrawal = async (requestData: any) => {
  const withdrawalData = {
    userEmail: requestData.userEmail,
    username: requestData.username,
    amount: requestData.amount,
    date: Timestamp.now(),
    status: "confirmed",
    withdrawalId: requestData.withdrawalId,
    address: requestData.address,
  };

  // Save the document with withdrawalId as the document ID
  await setDoc(doc(db, "withdrawals", requestData.withdrawalId), withdrawalData);
  await deductFromUserWallet(requestData.userId, requestData.amount);
};

export const revertWithdrawal = async (withdrawalId: string, requestId: string) => {
  try {
    const withdrawalDocRef = doc(db, "withdrawals", withdrawalId);
    const withdrawalDoc = await getDoc(withdrawalDocRef);

    if (withdrawalDoc.exists()) {
      await deleteDoc(withdrawalDocRef);
      toast.success("Withdrawal reverted and deleted.");

      // Update the corresponding withdrawal request back to pending
      const requestDocRef = doc(db, "withdrawalRequests", requestId);
      await updateDoc(requestDocRef, { status: "pending" });
      toast.success("Withdrawal request status updated to pending.");
    } else {
      toast.error("No matching withdrawal found to revert.");
    }
  } catch (error) {
    console.error("Error reverting withdrawal:", error);
    toast.error("Error reverting withdrawal. Please try again.");
  }
};
