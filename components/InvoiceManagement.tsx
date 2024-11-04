"use client";

import { formatDate } from "@/helpers/date";
import { db } from "@/lib/firebase";
import { Invoice } from "@/types/invoice";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Spinner,
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
} from "@nextui-org/react";
import {
  addDoc,
  collection,
  DocumentData,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Search } from "lucide-react";

// Define the NewInvoice type
type NewInvoice = {
  description: string;
  amount: number;
  status: "pending" | "paid"; // Adjust based on your status options
  userEmail: string;
  invoiceNumber: string;
  username: string;
  country: string;
};

type FilterOptions = {
  status: string[];
  dateRange: string[];
  amountRange: string;
};

type SortableField = keyof Pick<Invoice, 'invoiceNumber' | 'description' | 'amount' | 'status' | 'userEmail' | 'createdAt'>;

type SortConfig = {
  field: SortableField | '';
  direction: 'asc' | 'desc';
};

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newInvoice, setNewInvoice] = useState<NewInvoice>({
    description: "",
    amount: 0,
    status: "pending",
    userEmail: "",
    invoiceNumber: "",
    username: "",
    country: "",
  });
  const [possibleEmails, setPossibleEmails] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [],
    dateRange: [],
    amountRange: "",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: '', direction: 'asc' });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = () => {
      setLoading(true);
      try {
        const invoicesCollection = collection(db, "invoices");
        unsubscribe = onSnapshot(invoicesCollection, (snapshot) => {
          const invoicesData: Invoice[] = snapshot.docs.map((doc) => {
            const data = doc.data() as DocumentData;
            return {
              id: doc.id,
              invoiceNumber: data.invoiceNumber,
              description: data.description,
              amount: parseFloat(data.amount) || 0,
              date: data.date,
              status: data.status,
              userId: data.userId,
              userEmail: data.userEmail,
              createdAt: data.createdAt,
              username: data.username,
              country: data.country,
              userName: data.username,
            };
          });
          setInvoices(invoicesData);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error subscribing to invoices:", err);
        setLoading(false);
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleAddInvoice = async () => {
    // Validation
    if (!newInvoice.userEmail || !newInvoice.description || newInvoice.amount <= 0) {
      toast.error("Please fill in all fields: Email, Description, and Amount.");
      return;
    }

    try {
      // Fetch the latest invoice number
      const invoicesCollection = collection(db, "invoices");
      const invoicesSnapshot = await getDocs(invoicesCollection);
      const latestInvoiceNumber = invoicesSnapshot.docs.reduce((max, doc) => {
        const invoiceData = doc.data() as Invoice;
        const invoiceNum = parseInt(invoiceData.invoiceNumber.split('-')[1]);
        return Math.max(max, invoiceNum);
      }, 0) + 1; // Increment for the new invoice

      const newInvoiceWithDate = {
        ...newInvoice,
        createdAt: new Date().getTime(), // Set today's date as timestamp
        invoiceNumber: `INV-${latestInvoiceNumber}`, // Auto-generate invoice number
      };

      // Check for user in the users collection
      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("email", "==", newInvoice.userEmail));
      const snapshot = await getDocs(q);
      const userDoc = snapshot.docs[0];

      if (userDoc) {
        const username = userDoc.data().displayName;

        await addDoc(collection(db, "invoices"), {
          ...newInvoiceWithDate,
          userId: userDoc.id,
          userEmail: newInvoice.userEmail,
          username: username,
        });

        resetForm();
        toast.success("Invoice added successfully");
      } else {
        toast.error("User not found");
      }
    } catch (err) {
      console.error("Error adding invoice:", err);
    }
  };

  const resetForm = () => {
    setNewInvoice({
      description: "",
      amount: 0,
      status: "pending",
      userEmail: "",
      invoiceNumber: "",
      username: "",
      country: "",
    });
    setPossibleEmails([]);
    setUsername("");
  };

  const fetchUserEmailByUsername = async (username: string) => {
    if (!username) {
      setPossibleEmails([]);
      return;
    }

    try {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);

      const emails = snapshot.docs
        .filter(doc => doc.data().displayName.toLowerCase().includes(username.toLowerCase()))
        .map(doc => doc.data().email);

      setPossibleEmails(emails);
    } catch (error) {
      console.error("Error fetching user email:", error);
      setPossibleEmails([]);
    }
  };

  const filterInvoices = (invoices: Invoice[]) => {
    const filteredInvoices = invoices.filter((invoice) => {
      // Search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.description.toLowerCase().includes(searchLower) ||
        invoice.userEmail.toLowerCase().includes(searchLower) ||
        invoice.amount.toString().includes(searchQuery);

      // Status filter
      const matchesStatus =
        filterOptions.status.length === 0 ||
        filterOptions.status.includes(invoice.status);

      // Date range filter
      const matchesDate = filterOptions.dateRange.length === 0 || 
        filterOptions.dateRange.every(range => {
          const date = new Date(invoice.createdAt);
          switch(range) {
            case 'today':
              return isToday(date);
            case 'week':
              return isThisWeek(date);
            case 'month':
              return isThisMonth(date);
            default:
              return true;
          }
        });

      // Amount range filter
      const matchesAmount = !filterOptions.amountRange || 
        matchesAmountRange(invoice.amount, filterOptions.amountRange);

      return matchesSearch && matchesStatus && matchesDate && matchesAmount;
    });

    // Apply sorting if a sort field is selected
    if (sortConfig.field !== '') {
      filteredInvoices.sort((a, b) => {
        const field = sortConfig.field as SortableField; // Safe to cast now
        const aValue = a[field];
        const bValue = b[field];

        if (!aValue || !bValue) return 0;
        
        let comparison = 0;
        if (typeof aValue === 'string') {
          comparison = aValue.localeCompare(bValue as string);
        } else if (typeof aValue === 'number') {
          comparison = (aValue as number) - (bValue as number);
        } else if (typeof aValue === 'string' && !isNaN(Date.parse(aValue))) {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue as string);
          comparison = dateA.getTime() - dateB.getTime();
        }
        
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filteredInvoices;
  };

  const matchesAmountRange = (amount: number, range: string) => {
    switch(range) {
      case 'under100':
        return amount < 100;
      case '100to500':
        return amount >= 100 && amount <= 500;
      case 'over500':
        return amount > 500;
      default:
        return true;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
  };

  const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const invoiceRef = doc(db, "invoices", invoiceId);
      await updateDoc(invoiceRef, {
        status: "paid"
      });
      toast.success("Invoice marked as paid");
    } catch (err) {
      console.error("Error updating invoice:", err);
      toast.error("Failed to update invoice status");
    }
  };

  const FilterSection = () => (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Search className="text-gray w-4" />}
          className="w-full md:w-72"
          classNames={{
            input: "bg-dark text-light",
            label: "text-gray"
          }}
        />
        
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              className="bg-dark text-light"
            >
              Status Filter
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            className="text-light"
            selectionMode="multiple"
            selectedKeys={filterOptions.status}
            onSelectionChange={(keys) => setFilterOptions(prev => ({
              ...prev,
              status: Array.from(keys as Set<string>)
            }))}
          >
            <DropdownItem key="pending">Pending</DropdownItem>
            <DropdownItem key="paid">Paid</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              className="bg-dark text-light"
            >
              Date Filter
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            className="text-light"
            selectionMode="multiple"
            selectedKeys={filterOptions.dateRange}
            onSelectionChange={(keys) => setFilterOptions(prev => ({
              ...prev,
              dateRange: Array.from(keys as Set<string>)
            }))}
          >
            <DropdownItem key="today">Today</DropdownItem>
            <DropdownItem key="week">This Week</DropdownItem>
            <DropdownItem key="month">This Month</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="flat" 
              className="bg-dark text-light"
            >
              Amount Filter
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            className="text-light"
            selectionMode="single"
            selectedKeys={[filterOptions.amountRange]}
            onSelectionChange={(keys) => setFilterOptions(prev => ({
              ...prev,
              amountRange: Array.from(keys as Set<string>)[0]
            }))}
          >
            <DropdownItem key="under100">Under $100</DropdownItem>
            <DropdownItem key="100to500">$100 - $500</DropdownItem>
            <DropdownItem key="over500">Over $500</DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <Button 
          className="bg-orange/20 text-orange hover:bg-orange/30"
          onClick={() => {
            setSearchQuery("");
            setFilterOptions({
              status: [],
              dateRange: [],
              amountRange: "",
            });
          }}
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
      <ToastContainer />
      <div className="bg-darker p-6 rounded-xl border border-readonly/30 mb-8">
        <h2 className="text-xl font-bold mb-2">Search User</h2>
        <p className="text-gray mb-4">Enter a username to find the associated user email.</p>
        <Input
          type="text"
          label="Search by Username"
          value={username}
          classNames={{
            input: "bg-dark text-light",
            label: "text-gray"
          }}
          onChange={(e) => {
            setUsername(e.target.value);
            fetchUserEmailByUsername(e.target.value);
          }}
          className="max-w-md"
        />
        {possibleEmails.length > 0 && (
          <div className="mt-4 p-4 bg-dark rounded-lg border border-readonly/30 max-h-40 overflow-y-auto">
            <h3 className="font-semibold mb-2">Matching Emails:</h3>
            <ul className="flex flex-col space-y-2">
              {possibleEmails.map((email, index) => (
                <li 
                  key={index} 
                  className="text-gray hover:text-orange cursor-pointer transition-colors p-2 rounded hover:bg-readonly"
                  onClick={() => setNewInvoice({ ...newInvoice, userEmail: email })}
                >
                  {email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-darker p-6 rounded-xl border border-readonly/30">
        <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
        <div className="space-y-4">
          <Input
            label="User Email"
            value={newInvoice.userEmail}
            onChange={(e) => setNewInvoice({ ...newInvoice, userEmail: e.target.value })}
            classNames={{
              input: "bg-dark text-light",
              label: "text-gray"
            }}
          />
          <Select
            label="Description"
            value={newInvoice.description}
            onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
            classNames={{
              base: "bg-dark text-light",
              label: "text-gray"
            }}
          >
            <SelectItem key="Monthly Subscription" className="text-light" value="Monthly Subscription">Monthly Subscription</SelectItem>
            <SelectItem key="Other" className="text-light" value="Other">Other</SelectItem>
          </Select>
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
          <Button 
            onClick={handleAddInvoice} 
            className="w-full bg-orange hover:bg-orange/90"
          >
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="bg-darker p-6 rounded-xl border border-readonly/30 mt-8">
        <h2 className="text-xl font-bold mb-4">Invoices</h2>
        
        <FilterSection />

        <Table
          aria-label="Invoices Table"
          className="rounded-lg shadow-md"
          classNames={{
            th: "bg-readonly text-light",
            td: "text-gray"
          }}
        >
          <TableHeader>
            {[
              { key: 'invoiceNumber', label: 'Invoice Number' },
              { key: 'description', label: 'Description' },
              { key: 'amount', label: 'Amount' },
              { key: 'status', label: 'Status' },
              { key: 'userEmail', label: 'User Email' },
              { key: 'createdAt', label: 'Created At' },
              { key: 'actions', label: 'Actions' }
            ].map(({ key, label }) => (
              <TableColumn 
                key={key}
                onClick={() => {
                  if (key !== 'actions') {
                    setSortConfig(prev => ({
                      field: key as SortableField,
                      direction: prev.field === key && prev.direction === 'asc' ? 'desc' : 'asc'
                    }))
                  }
                }}
                className={`cursor-pointer hover:bg-readonly/50 transition-colors ${
                  key === 'actions' ? 'cursor-default hover:bg-transparent' : ''
                }`}
              >
                <div className="flex items-center gap-1">
                  {label}
                  {sortConfig.field === key && (
                    <span className="text-xs">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
                <TableCell className="text-center">
                  <Spinner size="sm" />
                </TableCell>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
                <TableCell>{""}</TableCell>
              </TableRow>
            ) : (
              filterInvoices(invoices).map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-semibold text-light">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell className="px-4">${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell className="px-4">{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell className="px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invoice.status === 'paid' 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-orange/20 text-orange'
                    }`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell>{invoice.userEmail}</TableCell>
                  <TableCell>
                    {invoice.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-green-500/20 text-green-500 hover:bg-green-500/30"
                        onClick={() => handleMarkAsPaid(invoice.id)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoiceManagement;