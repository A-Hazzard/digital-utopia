"use client";

import Layout from "@/app/common/Layout";
import {
  fetchMoreWithdrawalRequests,
  fetchMoreWithdrawals,
  handleSearch as handleSearchUtil,
  handleUpdateStatus,
  listenToWithdrawalRequests,
  listenToWithdrawals,
  revertWithdrawal,
} from "@/utils/withdrawalManagementUtils";
import { formatDate } from "@/helpers/date";
import {
  Button,
  Input,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Checkbox,
} from "@nextui-org/react";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { gsap } from "gsap"; 
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  userId: string; 
}

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<
    WithdrawalRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWithdrawalPage, setCurrentWithdrawalPage] = useState(1);
  const [currentRequestPage, setCurrentRequestPage] = useState(1);
  const [totalWithdrawalPages, setTotalWithdrawalPages] = useState(0);
  const [totalRequestPages, setTotalRequestPages] = useState(0);
  const [lastVisibleWithdrawal, setLastVisibleWithdrawal] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastVisibleRequest, setLastVisibleRequest] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [searchByWithdrawalId, setSearchByWithdrawalId] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const unsubscribeWithdrawals = listenToWithdrawals(
      setWithdrawals,
      setLastVisibleWithdrawal,
      setTotalWithdrawalPages,
      setLoading,
      setError
    );
    const unsubscribeWithdrawalRequests = listenToWithdrawalRequests(
      setWithdrawalRequests,
      setLastVisibleRequest,
      setTotalRequestPages,
      setLoading,
      setError
    );
    return () => {
      unsubscribeWithdrawals();
      unsubscribeWithdrawalRequests();
    };
  }, []);

  useEffect(() => {
    // GSAP animation for the component
    gsap.from(".withdrawal-table", { opacity: 0, y: -50, duration: 0.5, stagger: 0.1 });
  }, []);

  const handleWithdrawalPageChange = (page: number) => {
    setCurrentWithdrawalPage(page);
    if (page > currentWithdrawalPage && lastVisibleWithdrawal) {
      fetchMoreWithdrawals(
        lastVisibleWithdrawal,
        setWithdrawals,
        setLastVisibleWithdrawal
      );
    }
  };

  const handleRequestPageChange = (page: number) => {
    setCurrentRequestPage(page);
    if (page > currentRequestPage && lastVisibleRequest) {
      fetchMoreWithdrawalRequests(
        lastVisibleRequest,
        setWithdrawalRequests,
        setLastVisibleRequest
      );
    }
  };

  const handleSearch = () => {
    handleSearchUtil(
      searchByWithdrawalId,
      searchInput,
      setWithdrawals,
      setWithdrawalRequests,
      setLoading,
      setError
    );
  };

  const handleConfirmWithdrawal = async (request: WithdrawalRequest) => {
    await handleUpdateStatus(request.id, request.withdrawalId, "confirmed", true);
  };

  const handleRevertWithdrawal = async (withdrawalId: string) => {
    await revertWithdrawal(withdrawalId);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Layout>
      <ToastContainer />
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2 text-light">Search Withdrawals</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            type="text"
            placeholder={searchByWithdrawalId ? "Search by Withdrawal ID" : "Search by User Email"}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Checkbox
            isSelected={searchByWithdrawalId}
            onChange={(e) => setSearchByWithdrawalId(e.target.checked)}
          >
            Search by Withdrawal ID
          </Checkbox>
          <Button onClick={handleSearch} disabled={!searchInput}>
            Search
          </Button>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2 text-light">Withdrawals</h3>
      <Table
        aria-label="Withdrawals Table"
        className="withdrawal-table mb-8 text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>Withdrawal ID</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Username</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow key={withdrawal.id}>
              <TableCell>{withdrawal.withdrawalId || "N/A"}</TableCell>
              <TableCell>{withdrawal.userEmail}</TableCell>
              <TableCell>{withdrawal.username}</TableCell>
              <TableCell>{withdrawal.amount}</TableCell>
              <TableCell>{formatDate(withdrawal.date)}</TableCell>
              <TableCell>{withdrawal.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        total={totalWithdrawalPages}
        initialPage={1}
        page={currentWithdrawalPage}
        onChange={handleWithdrawalPageChange}
        className="mt-4"
      />

      <h3 className="text-xl font-bold mb-2 text-light">Withdrawal Requests</h3>
      <Table
        aria-label="Withdrawal Requests Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>Withdrawal ID</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Username</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Address</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {withdrawalRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.withdrawalId}</TableCell>
              <TableCell>{request.userEmail}</TableCell>
              <TableCell>{request.username}</TableCell>
              <TableCell>{request.amount}</TableCell>
              <TableCell>{formatDate(request.date)}</TableCell>
              <TableCell>{request.status}</TableCell>
              <TableCell>{request.address}</TableCell>
              <TableCell>
                {request.status === "pending" ? (
                  <Button
                    size="sm"
                    color="primary"
                    onClick={() => handleConfirmWithdrawal(request)}
                  >
                    Confirm
                  </Button>
                ) : request.status === "confirmed" ? (
                  <Button
                    size="sm"
                    color="warning"
                    onClick={() => handleRevertWithdrawal(request.withdrawalId)}
                  >
                    Revert
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        total={totalRequestPages}
        initialPage={1}
        page={currentRequestPage}
        onChange={handleRequestPageChange}
        className="mt-4"
      />
    </Layout>
  );
};

export default WithdrawalManagement;
