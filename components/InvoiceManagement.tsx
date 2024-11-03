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
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
      <ToastContainer />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoices Table Section */}
        <div className="lg:col-span-2">
          <div className="bg-darker p-6 rounded-xl border border-readonly/30">
            <h2 className="text-xl font-bold mb-6">Invoices</h2>
            <Table
              aria-label="Invoices Table"
              className="rounded-lg shadow-md"
              classNames={{
                th: "bg-readonly text-light",
                td: "text-gray"
              }}
            >
              <TableHeader>
                <TableColumn>Invoice Number</TableColumn>
                <TableColumn>Description</TableColumn>
                <TableColumn>Amount</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>User</TableColumn>
                <TableColumn>User Email</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow 
                    key={invoice.id} 
                    className=""
                  >
                    <TableCell className="font-semibold text-light">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.description}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === 'paid' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-orange/20 text-orange'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell>{invoice.userName}</TableCell>
                    <TableCell>{invoice.userEmail}</TableCell>
                    <TableCell>
                      {/* Conditionally render the button based on the invoice status */}
                      {invoice.status !== 'paid' && (
                        <Button
                          size="sm"
                          className="bg-orange hover:bg-orange/90"
                          onClick={() => handleStatusChange(invoice.id, "paid")}
                          isLoading={loadingInvoices[invoice.id]}
                          disabled={loadingInvoices[invoice.id]}
                        >
                          Mark as Paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add Invoice Form */}
        <div className="lg:col-span-1">
          <div className="bg-darker p-6 rounded-xl border border-readonly/30">
            <h3 className="text-xl font-bold mb-6">Create Invoice</h3>
            <div className="space-y-4">
              {/* Form fields for creating a new invoice */}
              <Input
                label="Invoice Number"
                value={newInvoice.invoiceNumber}
                onChange={(e) => setNewInvoice({ ...newInvoice, invoiceNumber: e.target.value })}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
              <Input
                label="Description"
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
              <Input
                label="Amount"
                type="number"
                value={newInvoice.amount.toString()}
                onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) || 0 })}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
              <Input
                label="User Name"
                value={newInvoice.userName}
                onChange={(e) => setNewInvoice({ ...newInvoice, userName: e.target.value })}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
              <Input
                label="Country"
                value={newInvoice.country}
                onChange={(e) => setNewInvoice({ ...newInvoice, country: e.target.value })}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
              <Button 
                onClick={handleAddInvoice} 
                className="w-full bg-orange hover:bg-orange/90"
              >
                Create Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceManagement;