"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { XIcon } from "lucide-react";
import PaymentMethod from "./PaymentMethod"; 
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    invoiceNumber: string;
    description: string;
    amount: string;
    date: string;
    status: string;
    userName: string;
    country: string;
    userGender?: string;
  };
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ visible, onClose, invoice }) => {
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [firebaseUserName, setFirebaseUserName] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setShowPaymentMethod(false);
      
      const user = auth.currentUser;
      if (user) {
        setFirebaseUserName(user.displayName);

        const fetchUserData = async () => {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserGender(userData.gender);
          }
        };

        fetchUserData();
      }
    }
  }, [visible]);

  if (!visible) return null;

  const titlePrefix = userGender === "male" ? "Mr." : userGender === "female" ? "Ms." : "";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark text-light p-6 rounded-lg w-full h-full md:w-[70vw] md:h-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Invoice #{invoice.invoiceNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-light text-2xl"
          >
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
                <p className="text-light">{titlePrefix} {firebaseUserName || invoice.userName}</p>
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
          />
        )}
      </div>
    </div>
  );
};

export default InvoiceModal;
