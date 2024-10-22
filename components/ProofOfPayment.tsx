import { Button } from "@nextui-org/react";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Image as ImageIcon, X as XIcon } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { auth, db, storage } from "../lib/firebase"; // Import Firebase storage and Firestore

interface ProofOfPaymentProps {
  onBack: () => void;
  userId?: string;
  purpose: "deposit" | "invoice";
  invoiceNumber?: string;
  amount?: string;
}

const ProofOfPayment: React.FC<ProofOfPaymentProps> = ({
  onBack,
  userId,
  purpose,
  invoiceNumber,
  amount,
}) => {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const userEmail = auth.currentUser?.email;
  const MIN_TRANSACTION_ID_LENGTH = 10;
  const TRANSACTION_ID_REGEX = React.useMemo(() => /^[a-zA-Z0-9]{10,}$/, []);

  useEffect(() => {
    const isTransactionIdValid =
      transactionId.length >= MIN_TRANSACTION_ID_LENGTH &&
      TRANSACTION_ID_REGEX.test(transactionId);
    setIsConfirmDisabled(!(receipt || isTransactionIdValid));
  }, [receipt, transactionId, MIN_TRANSACTION_ID_LENGTH, TRANSACTION_ID_REGEX]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setReceipt(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReceipt(null);
    setReceiptPreview(null);
  };

  const handleConfirmDeposit = async () => {
    setLoading(true);
    try {
      let receiptURL = "";

      if (receipt) {
        const receiptRef = ref(storage, `receipts/${receipt.name}`);
        await uploadBytes(receiptRef, receipt);
        receiptURL = await getDownloadURL(receiptRef);
      }

      if (!transactionId && !receipt) {
        throw new Error(
          "At least one of Transaction ID or Receipt must be provided."
        );
      }

      if (purpose === "deposit") {
        if (!userId) {
          throw new Error("User ID is required.");
        }

        const depositAmount = parseFloat(amount || "0");

        const depositData = {
          userId,
          userEmail,
          transactionId,
          receiptURL,
          amount: depositAmount,
          createdAt: new Date(),
          status: "pending",
        };

        await setDoc(
          doc(db, "deposits", transactionId || new Date().toISOString()),
          depositData
        );
        await sendDepositEmail(depositData);
        toast.success(
          "Deposit Request Submitted! Funds will show up within 24 to 48 hours."
        );
      } else if (purpose === "invoice" && userEmail && amount) {
        await sendInvoiceEmail({
          userEmail,
          transactionId,
          amount,
          receiptURL,
        });

        toast.success(
          "Invoice Submission Submitted! Approval will be given within 24 to 48 hours."
        );
      }
    } catch (error: unknown) {
      console.error("Error confirming deposit:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "Failed to submit deposit request. Please try again."
        );
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const sendDepositEmail = async (depositData: {
    userId: string;
    transactionId: string;
    receiptURL: string;
  }) => {
    try {
      const response = await fetch("/api/sendDepositEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(depositData),
      });

      if (!response.ok) {
        throw new Error("Failed to send deposit notification email.");
      }
    } catch (error) {
      console.error("Error sending deposit email:", error);
      toast.error("Failed to send deposit notification email.");
    }
  };

  const sendInvoiceEmail = async (invoiceData: {
    userEmail: string;
    transactionId: string;
    amount: string;
    receiptURL: string;
  }) => {
    try {
      const response = await fetch("/api/sendInvoiceEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error("Failed to send invoice notification email.");
      }
    } catch (error) {
      console.error("Error sending invoice email:", error);
      toast.error("Failed to send invoice notification email.");
    }
  };

  return (
    <div className="space-y-4">
      <ToastContainer />
      <h2 className="text-gray">
        Proof of Payment for Invoice #{invoiceNumber}
      </h2>
      <p className="text-gray">Amount: {amount}</p>

      <div className="border border-gray-600 rounded-lg p-4 flex flex-col gap-4">
        <div
          className={`border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center ${
            !!transactionId ? "cursor-not-allowed" : "cursor-pointer"
          } transition-colors relative`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={`hidden ${!transactionId ? "cursor-not-allowed" : ""}`}
            id="receipt-upload"
            disabled={!!transactionId}
          />
          <label
            htmlFor="receipt-upload"
            className={`flex flex-col items-center ${
              !!transactionId ? "cursor-not-allowed" : "cursor-pointer"
            } w-full h-full`}
          >
            {receiptPreview ? (
              <>
                <Image
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="max-w-full max-h-48 object-contain"
                  width={300}
                  height={300}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveImage();
                  }}
                  className="absolute top-2 right-2 bg-gray-800 rounded-full p-1 hover:bg-gray-700 cursor-pointer"
                >
                  <XIcon className="w-4 h-4 text-light" />
                </button>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-light mb-2" />
                <span className="text-light">Upload Receipt</span>
              </>
            )}
          </label>
        </div>

        <div className="text-center text-gray-400">OR</div>

        <div className="relative w-full">
          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className={`w-full bg-transparent text-light border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-orange ${
              !!receipt ? "cursor-not-allowed" : ""
            }`}
            placeholder="Enter Transaction ID"
            readOnly={!!receipt}
          />
          <label className="absolute text-sm text-gray-400 -top-2.5 left-2 bg-dark px-1">
            Transaction ID
          </label>
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button className="bg-transparent text-light" onClick={onBack}>
          Back
        </Button>
        <Button
          className={`${
            isConfirmDisabled
              ? "bg-gray text-light cursor-not-allowed"
              : "bg-orange"
          } text-light`}
          onClick={handleConfirmDeposit}
          disabled={isConfirmDisabled || loading}
          isLoading={loading}
        >
          Confirm Deposit
        </Button>
      </div>
    </div>
  );
};

export default ProofOfPayment;
