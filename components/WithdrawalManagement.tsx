"use client";

import { formatDate } from "@/helpers/date";
import {
  fetchMoreWithdrawalRequests,
  fetchMoreWithdrawals,
  handleSearch as handleSearchUtil,
  handleUpdateStatus,
  listenToWithdrawalRequests,
  listenToWithdrawals,
  revertWithdrawal,
} from "@/utils/withdrawalManagementUtils";
import {
  Button,
  Checkbox,
  Input,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { gsap } from "gsap";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
    <ToastContainer />
    
    {/* Search Section */}
    <div className="bg-darker p-6 rounded-xl border border-readonly/30 mb-8">
      <h2 className="text-xl font-bold mb-2">Search Withdrawals</h2>
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          type="text"
          placeholder={searchByWithdrawalId ? "Search by Withdrawal ID" : "Search by User Email"}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
          classNames={{
            input: "bg-dark text-light",
            label: "text-gray"
          }}
        />
        <Checkbox
          isSelected={searchByWithdrawalId}
          onChange={(e) => setSearchByWithdrawalId(e.target.checked)}
          className="text-gray"
        >
          Search by Withdrawal ID
        </Checkbox>
        <Button 
          onClick={handleSearch} 
          disabled={!searchInput}
          className="bg-orange hover:bg-orange/90"
        >
          Search
        </Button>
      </div>
    </div>
  
    {/* Withdrawals Table */}
    <div className="bg-darker p-6 rounded-xl border border-readonly/30 mb-8">
      <h3 className="text-xl font-bold mb-4">Withdrawals</h3>
      <Table
        aria-label="Withdrawals Table"
        className="withdrawal-table mb-4"
        classNames={{
          th: "bg-readonly text-light",
          td: "text-gray"
        }}
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
            <TableCell>${withdrawal.amount}</TableCell>
            <TableCell>{formatDate(withdrawal.date)}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                withdrawal.status === 'confirmed' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {withdrawal.status}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    <Pagination
      total={totalWithdrawalPages}
      initialPage={1}
      page={currentWithdrawalPage}
      onChange={handleWithdrawalPageChange}
      className="flex justify-center"
    />
  </div>

  {/* Withdrawal Requests Section */}
  <div className="bg-darker p-6 rounded-xl border border-readonly/30">
    <h3 className="text-xl font-bold mb-4">Withdrawal Requests</h3>
    <Table
      aria-label="Withdrawal Requests Table"
      className="withdrawal-table mb-4"
      classNames={{
        th: "bg-readonly text-light",
        td: "text-gray"
      }}
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
            <TableCell>${request.amount}</TableCell>
            <TableCell>{formatDate(request.date)}</TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                request.status === 'confirmed' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {request.status}
              </span>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{request.address}</TableCell>
            <TableCell>
              {request.status === "pending" ? (
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => handleConfirmWithdrawal(request)}
                  className="bg-primary hover:bg-primary/80"
                >
                  Confirm
                </Button>
              ) : request.status === "confirmed" ? (
                <Button
                  size="sm"
                  color="warning"
                  onClick={() => handleRevertWithdrawal(request.withdrawalId)}
                  className="bg-warning hover:bg-warning/80"
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
      className="flex justify-center"
    />
  </div>
    </div>

  );
};

export default WithdrawalManagement;
