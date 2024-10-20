"use client";

import { useEffect, useState } from "react";
import { Table, Button, TableHeader, TableColumn, TableCell, TableBody, TableRow } from "@nextui-org/react";
import { db } from '@/lib/firebase'; // Adjust the import based on your project structure
import { collection, getDocs, Timestamp } from "firebase/firestore";

// Define an interface for the Firestore Timestamp
interface FirestoreTimestamp {
    seconds: number;
    nanoseconds: number;
}

// Function to format the date
const formatDate = (timestamp: FirestoreTimestamp | Date | string | number) => {
    let date: Date;

    if (
        timestamp &&
        typeof (timestamp as FirestoreTimestamp).seconds === 'number' &&
        typeof (timestamp as FirestoreTimestamp).nanoseconds === 'number'
    ) {
        // Create a new Firebase Timestamp
        const firebaseTimestamp = new Timestamp(
            (timestamp as FirestoreTimestamp).seconds,
            (timestamp as FirestoreTimestamp).nanoseconds
        );
        date = firebaseTimestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else {
        return 'Invalid Date';
    }

    // Format the date to only show the date part
    return date.toLocaleDateString(); // Change to toLocaleDateString()
};

// Define the Deposit interface
interface Deposit {
  id: string;
  userEmail: string;
  depositAmount: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string; // Add this line
}

const DepositManagement = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeposits = async () => {
      setLoading(true);
      try {
        const depositsCollection = collection(db, "deposits");
        const depositsSnapshot = await getDocs(depositsCollection);
        const depositsData = depositsSnapshot.docs.map(doc => ({
          id: doc.id,
          userEmail: doc.data().userEmail,
          depositAmount: doc.data().depositAmount, 
          status: doc.data().status,
          createdAt: formatDate(doc.data().createdAt), // Use the formatDate function
        }));
        setDeposits(depositsData);
      } catch (err) {
        setError("Failed to fetch deposits: " + (err instanceof Error ? err.message : "Unknown error"));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeposits();
  }, []);

  const handleStatusChange = (depositId: string, newStatus: 'completed' | 'failed') => {
    setDeposits(deposits.map(deposit => 
      deposit.id === depositId ? { ...deposit, status: newStatus } : deposit
    ));
  };

  if (loading) {
    return <p>Loading deposits...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">Deposit Management</h2>
      <Table aria-label="Deposits Table" className="text-light rounded-lg shadow-md bg-transparent">
        <TableHeader>
          <TableColumn>User</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Date</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {deposits.length > 0 ? deposits.map((deposit) => (
            <TableRow key={deposit.id}>
              <TableCell>{deposit.userEmail}</TableCell>
              <TableCell>{deposit.depositAmount}</TableCell>
              <TableCell>{deposit.status}</TableCell>
              <TableCell>{deposit.createdAt}</TableCell>
              <TableCell>
                <Button size="sm" color="primary" onClick={() => handleStatusChange(deposit.id, 'completed')}>
                  Complete
                </Button>
                <Button size="sm" color="danger" className="ml-2" onClick={() => handleStatusChange(deposit.id, 'failed')}>
                  Fail
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No deposits found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default DepositManagement;
