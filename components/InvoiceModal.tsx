"use client";

import { auth } from "@/lib/firebase";
import { Button } from "@nextui-org/react";
import { XIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import PaymentMethod from "./PaymentMethod";
import { Invoice } from "@/types/invoice";

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ visible, onClose, invoice }) => {
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [firebaseUserName, setFirebaseUserName] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setShowPaymentMethod(false);
      const user = auth.currentUser;
      if (user) {
        setFirebaseUserName(user.displayName);
      }
    }

  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark text-light p-6 rounded-lg w-full h-full md:w-[70vw] xl:w-[40vw] 2xl:w-[30vw] md:h-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Invoice #{invoice.invoiceNumber}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-light text-2xl">
            <XIcon size={24} />
          </button>
        </div>

        <hr className="border-gray-600 mb-4" />

        {!showPaymentMethod ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <span className="font-bold">From:</span>
                <p className="text-light">Digital Utopia</p>
              </div>
              <div className="text-right">
                <span className="font-bold">Invoice No.</span>
                <p className="text-light">{invoice.invoiceNumber}</p>
              </div>

              <div>
                <span className="font-bold">Date Paid:</span>
                <p className="text-light">
                  {invoice.status === "paid" ? "Paid" : "Not Paid"}
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold">To:</span>
                <p className="text-light">{firebaseUserName || invoice.userName}</p>
              </div>

              <div>
                <span className="font-bold">Country:</span>
                <p className="text-light">{invoice.country}</p>
              </div>
              <div className="text-right">
                <span className="font-bold">Invoice Date:</span>
                <p className="text-light">
                  {new Date(invoice.date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className="font-bold">Amount:</span>
                <p className="text-light">{invoice.amount}</p>
              </div>
              <div className="text-right">
                <span className="font-bold">Description:</span>
                <p className="text-light">{invoice.description}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="w-fit bg-orange text-light"
                onClick={() => setShowPaymentMethod(true)}
              >
                Pay Now
              </Button>
            </div>
          </>
        ) : (
          <PaymentMethod 
            onBack={() => {
              setShowPaymentMethod(false);
            }} 
            invoiceNumber={invoice.invoiceNumber} 
            amount={invoice.amount} 
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceModal;
