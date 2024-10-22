"use client";

import Layout from '@/app/common/Layout';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types/invoice';
import { Button, Input, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

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
  const [loadingInvoices, setLoadingInvoices] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

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
        userId: doc.data().userId || '', 
        userEmail: doc.data().userEmail || '', // Make sure this field is included
      })) as Invoice[];
      setInvoices(invoicesData);
    } catch (err) {
      setError("Failed to fetch invoices");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async () => {
    try {
      const newInvoiceWithDate = {
        ...newInvoice,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        userId: '', 
        userEmail: '', 
      };
      const docRef = await addDoc(collection(db, "invoices"), newInvoiceWithDate);
      setInvoices([...invoices, { ...newInvoiceWithDate, id: docRef.id }]);
      setNewInvoice({
        invoiceNumber: '',
        description: '',
        amount: "0 USDT",
        status: 'pending',
        userName: '',
        country: '',
      });
    } catch (err) {
      console.error("Error adding invoice:", err);
      setError("Failed to add invoice");
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    setLoadingInvoices(prev => ({ ...prev, [invoiceId]: true }));
    try {
      const invoiceRef = doc(db, "invoices", invoiceId);
      await updateDoc(invoiceRef, { status: newStatus });
      
      const updatedInvoice = invoices.find(invoice => invoice.id === invoiceId);
      if (updatedInvoice) {
        if (newStatus === 'paid') {
          if (!updatedInvoice.userEmail) {
            console.error("User email is missing for invoice:", updatedInvoice);
            toast.error("Failed to update invoice: User email is missing");
            return;
          }
          await sendClientInvoiceConfirmation(updatedInvoice);
        } else if (newStatus === 'overdue') {
          await sendClientInvoiceOverdue(updatedInvoice);
        }
      } else {
        console.error("Invoice not found:", invoiceId);
        toast.error("Failed to update invoice: Invoice not found");
        return;
      }

      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      ));

      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating invoice status:", err);
      setError("Failed to update invoice status");
      toast.error("Failed to update invoice status");
    } finally {
      setLoadingInvoices(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  const sendClientInvoiceConfirmation = async (invoice: Invoice) => {
    try {
      if (!invoice.userEmail) {
        console.error("User email is missing for invoice:", invoice);
        toast.error("Failed to send invoice confirmation email: User email is missing");
        return;
      }

      const response = await fetch("/api/sendClientInvoiceConfirmationEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: invoice.userEmail,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invoice confirmation email");
      }

      toast.success("Invoice confirmation email sent successfully");
    } catch (error) {
      console.error("Error sending invoice confirmation email:", error);
      toast.error("Failed to send invoice confirmation email");
    }
  };

  const sendClientInvoiceOverdue = async (invoice: Invoice) => {
    try {
      const response = await fetch("/api/sendClientInvoiceOverdueEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: invoice.userEmail,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invoice overdue email");
      }
    } catch (error) {
      console.error("Error sending invoice overdue email:", error);
      toast.error("Failed to send invoice overdue email");
    }
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
      <ToastContainer />
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
                  isLoading={loadingInvoices[invoice.id]}
                  disabled={loadingInvoices[invoice.id]}
                >
                  Mark as Paid
                </Button>
                <Button
                  size="sm"
                  color="warning"
                  className="ml-2"
                  onClick={() => handleStatusChange(invoice.id, "overdue")}
                  isLoading={loadingInvoices[invoice.id]}
                  disabled={loadingInvoices[invoice.id]}
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
