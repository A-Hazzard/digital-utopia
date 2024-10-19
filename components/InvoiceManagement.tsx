"use client";

import { useState } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableCell, TableRow, Button, Input } from "@nextui-org/react";
import { Invoice } from '@/types/invoice';

// Fake data for prototyping
const fakeInvoices: Invoice[] = [
  { id: '1', invoiceNumber: 'INV-001', description: 'Web Development', amount: "1000 USDT", status: 'pending', userName: 'John Doe', country: 'USA', date: new Date().toISOString() },
  { id: '2', invoiceNumber: 'INV-002', description: 'UI/UX Design', amount: "750 USDT", status: 'paid', userName: 'Jane Smith', country: 'Canada', date: new Date().toISOString() },
  { id: '3', invoiceNumber: 'INV-003', description: 'SEO Services', amount: "500 USDT", status: 'overdue', userName: 'Bob Johnson', country: 'UK', date: new Date().toISOString() },
];

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>(fakeInvoices);
  const [newInvoice, setNewInvoice] = useState<Omit<Invoice, 'id'>>({
    invoiceNumber: '',
    description: '',
    amount: "0 USDT",
    status: 'pending',
    userName: '',
    country: '',
    date: new Date().toISOString()
  });

  const handleAddInvoice = () => {
    const id = (invoices.length + 1).toString();
    const newInvoiceWithDate = {
      ...newInvoice,
      id,
      date: new Date().toISOString()
    };
    setInvoices([...invoices, newInvoiceWithDate]);
    setNewInvoice({
      invoiceNumber: '',
      description: '',
      amount: "0 USDT",
      status: 'pending',
      userName: '',
      country: '',
      date: new Date().toISOString()
    });
  };

  const handleStatusChange = (invoiceId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
    ));
  };

  return (
    <div>
      <h2 className="text-xl text-light font-bold mb-4">Invoice Management</h2>
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
