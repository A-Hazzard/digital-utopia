"use client";

import { useEffect, useState } from "react";
import { Table, Skeleton, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue, Pagination } from "@nextui-org/react";
import Layout from "@/app/common/Layout";
import { Invoice } from '@/types/invoice';
import InvoiceModal from '@/components/InvoiceModal';
import { UserProvider } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth } from "@/lib/firebase"; 

const InvoicesPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);

  useEffect(() => {
    const fetchData = () => {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (auth.currentUser?.uid) {
        const invoicesRef = collection(db, "invoices");
        const q = query(invoicesRef, where("userEmail", "==", auth.currentUser?.email));
        const querySnapshot = await getDocs(q);
        const invoices: Invoice[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Invoice[]; 
        setInvoicesData(invoices);
      }
    };

    fetchInvoices();
  }, []);

  const indexOfLastInvoice = currentPage * itemsPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - itemsPerPage;
  const currentInvoices = invoicesData.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(invoicesData.length / itemsPerPage);

  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const columns = [
    { key: "invoiceNumber", label: "Invoice Number" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" },
  ];

  return (
    <UserProvider>
      <Layout>
        <div className="p-4">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <>
              <Table
                aria-label="Invoices Table"
                className="text-light rounded-lg shadow-md bg-transparent"
                bottomContent={
                  <div className="flex w-full justify-center">
                    <Pagination
                      isCompact
                      showControls
                      showShadow
                      color="secondary"
                      page={currentPage}
                      total={totalPages}
                      onChange={(page) => setCurrentPage(page)}
                    />
                  </div>
                }
              >
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn
                      key={column.key}
                      className="bg-transparent text-light"
                    >
                      {column.label}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody items={currentInvoices}>
                  {(item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-background hover:cursor-pointer"
                      onClick={() => handleRowClick(item)}
                    >
                      {(columnKey) => (
                        <TableCell className="text-light bg-transparent">
                          {columnKey === "date" 
                            ? new Date(item.date).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              }) 
                            : getKeyValue(item, columnKey)}
                        </TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>

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
