"use client";

import { db } from "@/lib/firebase";
import { Invoice } from "@/types/invoice";
import {
  Button,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState<
    Omit<Invoice, "id" | "createdAt" | "userId" | "userEmail" | "date">
  >({
    invoiceNumber: "",
    description: "",
    amount: 0,
    status: "pending",
    userName: "",
    country: "",
  });
  const [loadingInvoices, setLoadingInvoices] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const invoicesCollection = collection(db, "invoices");
      const invoicesSnapshot = await getDocs(invoicesCollection);
      const invoicesData: Invoice[] = invoicesSnapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          invoiceNumber: data.invoiceNumber || "",
          description: data.description || "",
          amount: parseFloat(data.amount) || 0,
          date: data.date instanceof Date ? data.date : new Date(data.date),
          status: data.status || "",
          userId: data.userId || "",
          userEmail: data.userEmail || "",
          createdAt: data.createdAt || new Date().toISOString(),
          userName: data.userName || "",
          country: data.country || "",
        } as Invoice;
      });
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
        date: new Date(),
        createdAt: new Date().toISOString(),
        userId: "",
        userEmail: "",
      };
      const docRef = await addDoc(
        collection(db, "invoices"),
        newInvoiceWithDate
      );
      setInvoices([...invoices, { ...newInvoiceWithDate, id: docRef.id }]);
      setNewInvoice({
        invoiceNumber: "",
        description: "",
        amount: 0,
        status: "pending",
        userName: "",
        country: "",
      });
    } catch (err) {
      console.error("Error adding invoice:", err);
      setError("Failed to add invoice");
    }
  };

  const handleStatusChange = async (
    invoiceId: string,
    newStatus: "paid" | "pending"
  ) => {
    setLoadingInvoices((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const invoiceRef = doc(db, "invoices", invoiceId);
      await updateDoc(invoiceRef, { status: newStatus });

      setInvoices(
        invoices.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
        )
      );

      toast.success(`Invoice status updated to ${newStatus}`);
    } catch (err) {
      console.error("Error updating invoice status:", err);
      setError("Failed to update invoice status");
      toast.error("Failed to update invoice status");
    } finally {
      setLoadingInvoices((prev) => ({ ...prev, [invoiceId]: false }));
    }
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
              <TableCell>${invoice.amount.toFixed(2)}</TableCell>
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
          type="number"
          value={newInvoice.amount.toString()}
          onChange={
            (e) =>
              setNewInvoice({
                ...newInvoice,
                amount: parseFloat(e.target.value) || 0,
              })
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
