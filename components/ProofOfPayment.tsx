import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { Image as ImageIcon, X as XIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { storage, db, auth } from "../lib/firebase"; // Import Firebase storage and Firestore
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";

interface ProofOfPaymentProps {
  onBack: () => void;
  userId: string; // Pass user ID to associate the deposit with the user
}

const ProofOfPayment: React.FC<ProofOfPaymentProps> = ({
  onBack,
  userId,
}) => {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);
  const [loading, setLoading] = useState(false); // Loading state
  const userEmail = auth.currentUser?.email;
  const MIN_TRANSACTION_ID_LENGTH = 10; // Set your minimum length here
  const TRANSACTION_ID_REGEX = React.useMemo(() => /^[a-zA-Z0-9]{10,}$/, []); // Example regex for alphanumeric IDs with a minimum length

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
        setReceiptPreview(reader.result as string); // Ensure this is a valid data URL
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setReceipt(null);
    setReceiptPreview(null);
  };

  const handleConfirmDeposit = async () => {
    setLoading(true); // Set loading to true
    try {
      let receiptURL = "";

      if (receipt) {
        // Upload the receipt to Firebase Storage
        const receiptRef = ref(storage, `receipts/${receipt.name}`);
        await uploadBytes(receiptRef, receipt);
        receiptURL = await getDownloadURL(receiptRef);
      }

      // Ensure at least one of the fields is filled
      if (!transactionId && !receipt) {
        throw new Error("At least one of Transaction ID or Receipt must be provided.");
      }

      // Validate userId
      if (!userId) {
        throw new Error("User ID is required.");
      }

      // Save transaction details to Firestore
      const depositData = {
        userId,
        userEmail,
        transactionId,
        receiptURL,
        createdAt: new Date(),
      };

      // Reference the document in the "deposits" collection using the transactionId
      await setDoc(doc(db, "deposits", transactionId || new Date().toISOString()), depositData);

      // Send email notification
      await sendDepositEmail(depositData);

      // Show success message
      toast.success("Deposit request submitted! Funds will show up within 24 to 48 hours.");
    } catch (error: unknown) {
      console.error("Error confirming deposit:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to submit deposit request. Please try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Function to send deposit email
  const sendDepositEmail = async (depositData: { userId: string; transactionId: string; receiptURL: string }) => {
    try {
      const response = await fetch('/api/sendDepositEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  return (
    <div className="space-y-4">
      <h2 className="text-gray">Proof of Payment</h2>

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
            disabled={!!transactionId} // Disable if transaction ID is entered
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
                  width={300} // Adjust width as needed
                  height={300} // Adjust height as needed
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
            readOnly={!!receipt} // Make readonly if an image is uploaded
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
            isConfirmDisabled ? "bg-gray text-light cursor-not-allowed" : "bg-orange"
          } text-light`}
          onClick={handleConfirmDeposit}
          disabled={isConfirmDisabled || loading} // Disable if loading
          isLoading={loading} // Use the loading prop
        >
          Confirm Deposit
        </Button>
      </div>
    </div>
  );
};

export default ProofOfPayment;
