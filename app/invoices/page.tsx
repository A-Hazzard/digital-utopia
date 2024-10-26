"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/app/common/Layout";
import { Invoice } from '@/types/invoice';
import InvoiceModal from '@/components/InvoiceModal';
import { UserProvider } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "@/lib/firebase"; 
import { Spinner, Input, Checkbox } from "@nextui-org/react";
import { formatDate } from "@/helpers/date";
import { User } from "firebase/auth";

const InvoicesPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100; // Set items per page to 100
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<{ [key: string]: boolean }>({
    paid: false,
    pending: false,
    overdue: false,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchInvoices(user.email || "");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchInvoices = async (userEmail: string) => {
    const invoicesRef = collection(db, "invoices");
    const q = query(invoicesRef, where("userEmail", "==", userEmail));
    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        invoiceNumber: data.invoiceNumber || "",
        description: data.description || "",
        amount: parseFloat(data.amount) || 0,
        date: data.date instanceof Date ? data.date : new Date(data.date), 
        status: data.status || "",
      } as Invoice; 
    });
    setInvoicesData(invoices);
    setLoading(false);
  };

  const filteredInvoices = invoicesData.filter(invoice => {
    const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilters[invoice.status.toLowerCase()] || Object.values(statusFilters).every(v => !v);
    const dateMatch = formatDate(invoice.date).toLowerCase().includes(searchTerm.toLowerCase());
    return (invoiceNumberMatch || dateMatch) && statusMatch;
  });

  const indexOfLastInvoice = currentPage * itemsPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilters(prev => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <UserProvider>
      <Layout>
        <div className="p-4 text-light">
          {loading ? (
            <Spinner size="md" />
          ) : (
            <>
              <h2 className="text-lg font-bold mb-2">Search and Filter Invoices</h2>
              <p className="mb-4">Use the search bar to find invoices by invoice number or date. You can also filter by status to narrow down your results.</p>
              <Input
                isClearable
                placeholder="Search by Invoice Number, Date, or Status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="flex mb-4 gap-4"> {/* Added gap for spacing */}
                <Checkbox
                  isSelected={statusFilters.paid}
                  onChange={() => handleStatusChange('paid')}
                >
                  Paid
                </Checkbox>
                <Checkbox
                  isSelected={statusFilters.pending}
                  onChange={() => handleStatusChange('pending')}
                >
                  Pending
                </Checkbox>
                <Checkbox
                  isSelected={statusFilters.overdue}
                  onChange={() => handleStatusChange('overdue')}
                >
                  Overdue
                </Checkbox>
              </div>
              <div className="overflow-x-auto">
                <table className="text-light min-w-full">
                  <thead>
                    <tr className="text-gray-400 text-xs sm:text-sm border-b border-dashed border-gray">
                      <th className="text-left p-2">Invoice Number</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInvoices.length > 0 ? (
                      currentInvoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className={`border-b border-gray hover:bg-gray-700 cursor-pointer`}
                          onClick={() => handleRowClick(invoice)}
                        >
                          <td className="py-2">{invoice.invoiceNumber}</td>
                          <td className="py-2">{invoice.description}</td>
                          <td className="py-2 text-right">${invoice.amount.toFixed(2)}</td>
                          <td className="py-2">{formatDate(invoice.date)}</td>
                          <td className="py-2">{invoice.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-2">No invoices found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>

              {selectedInvoice && (
                <InvoiceModal
                  visible={modalVisible}
                  onClose={() => setModalVisible(false)}
                  invoice={selectedInvoice}
                />
              )}
            </>
          )}
        </div>
      </Layout>
    </UserProvider>
  );
};

export default InvoicesPage;
