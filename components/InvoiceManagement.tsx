"use client";

import Layout from '@/app/common/Layout';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types/invoice';
import { Button, Input, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState<Omit<Invoice, 'id' | 'createdAt' | 'userId' | 'userEmail' | 'date'>>({
    invoiceNumber: '',
    description: '',
    amount: "0 USDT",
    status: 'pending',
    userName: '',
    country: '',
  });

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const invoicesCollection = collection(db, "invoices");
        const invoicesSnapshot = await getDocs(invoicesCollection);
        const invoicesData = invoicesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          userId: '', 
          userEmail: '', 
        })) as Invoice[];
        setInvoices(invoicesData);
      } catch (err) {
        setError("Failed to fetch invoices");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleAddInvoice = () => {
    const id = (invoices.length + 1).toString();
    const newInvoiceWithDate = {
      ...newInvoice,
      id,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId: '', 
      userEmail: '', 
    };
    setInvoices([...invoices, newInvoiceWithDate]);
    setNewInvoice({
      invoiceNumber: '',
      description: '',
      amount: "0 USDT",
      status: 'pending',
      userName: '',
      country: '',
    });
  };

  const handleStatusChange = (invoiceId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
    ));
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
      <Table
        aria-label="Invoices Table"
        className="text-light rounded-lg shadow-md bg-transparent"
      >
        <TableHeader>
          <TableColumn>Invoice Number</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Amount</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>User</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.description}</TableCell>
              <TableCell>${invoice.amount}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{invoice.userName}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => handleStatusChange(invoice.id, "paid")}
                >
                  Mark as Paid
                </Button>
                <Button
                  size="sm"
                  color="warning"
                  className="ml-2"
                  onClick={() => handleStatusChange(invoice.id, "overdue")}
                >
                  Mark as Overdue
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4">
        <h3 className="text-sm text-light font-bold">Add New Invoice</h3>
        <Input
          label="Invoice Number"
          value={newInvoice.invoiceNumber}
          onChange={(e) =>
            setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })
          }
          className="mb-2"
        />
        <Input
          label="Description"
          value={newInvoice.description}
          onChange={(e) =>
            setNewInvoice({ ...newInvoice, description: e.target.value })
          }
          className="mb-2"
        />
        <Input
          label="Amount"
          type="text"
          value={newInvoice.amount}
          onChange={(e) =>
            setNewInvoice({ ...newInvoice, amount: e.target.value })
          }
          className="mb-2"
        />
        <Input
          label="User Name"
          value={newInvoice.userName}
          onChange={(e) =>
            setNewInvoice({ ...newInvoice, userName: e.target.value })
          }
          className="mb-2"
        />
        <Input
          label="Country"
          value={newInvoice.country}
          onChange={(e) =>
            setNewInvoice({ ...newInvoice, country: e.target.value })
          }
          className="mb-2"
        />
        <Button onClick={handleAddInvoice} className="mt-2">
          Add Invoice
        </Button>
      </div>
    </div>
  );
};

export default InvoiceManagement;
