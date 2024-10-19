"use client";

import { useEffect, useState } from "react";
import { Table, Skeleton, TableHeader, TableColumn, TableBody, TableRow, TableCell, getKeyValue, Pagination } from "@nextui-org/react";
import Layout from "@/app/common/Layout";
import { Invoice } from '@/types/invoice';
import InvoiceModal from '@/components/InvoiceModal';
import { UserProvider } from "@/context/UserContext";

const invoicesData: Invoice[] = Array.from({ length: 20 }, (_, i) => ({
  id: `INV-${i + 1}`,
  invoiceNumber: `${i + 1}/01/2024 12:00`,
  description: "Subscription Fee",
  amount: "75 USDT",
  date: new Date(2024, 0, i + 1).toISOString(), 
  status: Math.random() > 0.5 ? "paid" : "pending", 
  userName: `User ${i + 1}`,
  country: "Trinidad & Tobago", 
}));

const sortedInvoicesData = invoicesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

const columns = [
  { key: "invoiceNumber", label: "Invoice Number" },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

const InvoicesPage = () => {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = () => {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    fetchData();
  }, []);

  const indexOfLastInvoice = currentPage * itemsPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - itemsPerPage;
  const currentInvoices = sortedInvoicesData.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(sortedInvoicesData.length / itemsPerPage);

  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

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
                          {getKeyValue(item, columnKey)}
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
