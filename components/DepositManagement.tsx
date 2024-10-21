"use client";

import Layout from "@/app/common/Layout";
import { formatDate } from "@/helpers/date";
import { db } from "@/lib/firebase";
import {
  Button,
  Input,
  Spinner,
  TableBody,
  TableCell,
  Table,
  TableColumn,
  TableHeader,
  TableRow
} from "@nextui-org/react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

type Investment = {
  id: string;
  userEmail: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

const DepositManagement = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInvestment, setNewInvestment] = useState<
    Omit<Investment, "id" | "createdAt">
  >({
    userEmail: "",
    amount: 0,
    status: "pending",
  });

  useEffect(() => {
    const fetchInvestments = async () => {
      setLoading(true);
      try {
        const investmentsCollection = collection(db, "investments");
        const investmentsSnapshot = await getDocs(investmentsCollection);
        const investmentsData = investmentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          userEmail: doc.data().userEmail,
          amount: doc.data().amount,
          status: doc.data().status,
          createdAt: formatDate(doc.data().createdAt),
        }));
        setInvestments(investmentsData);
      } catch (err) {
        setError(
          "Failed to fetch investments: " +
            (err instanceof Error ? err.message : "Unknown error")
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  const handleAddInvestment = async () => {
    await addDoc(collection(db, "investments"), {
      ...newInvestment,
      createdAt: new Date(),
    });
    setNewInvestment({
      userEmail: "",
      amount: 0,
      status: "pending",
    });
    // Fetch investments again to update the list
    const investmentsCollection = collection(db, "investments");
    const investmentsSnapshot = await getDocs(investmentsCollection);
    const investmentsData = investmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      userEmail: doc.data().userEmail,
      amount: doc.data().amount,
      status: doc.data().status,
      createdAt: doc.data().createdAt,
    }));
    setInvestments(investmentsData);
  };

  const handleStatusChange = (
    investmentId: string,
    newStatus: "completed" | "failed"
  ) => {
    setInvestments(
      investments.map((investment) =>
        investment.id === investmentId
          ? { ...investment, status: newStatus }
          : investment
      )
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">
        Investment Management
      </h2>
      <div className="mb-4">
        <Input
          type="text"
          label="User Email"
          value={newInvestment.userEmail}
          onChange={(e) =>
            setNewInvestment({ ...newInvestment, userEmail: e.target.value })
          }
          className="mb-2"
        />
        <Input
          type="number"
          label="Investment Amount"
          value={newInvestment.amount.toString()}
          onChange={(e) =>
            setNewInvestment({
              ...newInvestment,
              amount: Number(e.target.value),
            })
          }
          className="mb-2"
        />
        <select
          value={newInvestment.status}
          onChange={(e) =>
            setNewInvestment({
              ...newInvestment,
              status: e.target.value as "pending" | "completed" | "failed",
            })
          }
          className="mb-2 p-2 border rounded"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <Button onClick={handleAddInvestment}>Add Investment</Button>
      </div>
      <Table
        aria-label="Investments Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>User</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>  
        <TableBody>
          {investments.length > 0 ? (
            investments.map((investment) => (
              <TableRow key={investment.id}>
                <TableCell>{investment.userEmail}</TableCell>
                <TableCell>{investment.amount}</TableCell>
                <TableCell>{investment.status}</TableCell>
                <TableCell>{formatDate(investment.createdAt)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={() =>
                      handleStatusChange(investment.id, "completed")
                    }
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    className="ml-2"
                    onClick={() => handleStatusChange(investment.id, "failed")}
                  >
                    Fail
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No investments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DepositManagement;
