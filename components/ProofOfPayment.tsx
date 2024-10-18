import React, { useState, useEffect } from 'react';
import { Button } from "@nextui-org/react";
import { Image as ImageIcon, X as XIcon } from 'lucide-react';

interface ProofOfPaymentProps {
  onBack: () => void;
  onConfirm: () => void;
}

const ProofOfPayment: React.FC<ProofOfPaymentProps> = ({ onBack, onConfirm }) => {
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);

  useEffect(() => {
    setIsConfirmDisabled(!receipt && !transactionId.trim());
  }, [receipt, transactionId]);

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

  return (
    <div className="space-y-4">
      <h2 className="text-gray">Proof of Payment</h2>
      
      <div className="border border-gray-600 rounded-lg p-4 flex flex-col gap-4">
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="receipt-upload"
          />
          <label htmlFor="receipt-upload" className="flex flex-col items-center cursor-pointer w-full h-full">
            {receiptPreview ? (
              <>
                <img src={receiptPreview} alt="Receipt preview" className="max-w-full max-h-48 object-contain" />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveImage();
                  }}
                  className="absolute top-2 right-2 bg-gray-800 rounded-full p-1 hover:bg-gray-700"
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
            className="w-full bg-transparent text-light border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-orange"
            placeholder="Enter Transaction ID"
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
          className={`${isConfirmDisabled ? 'bg-gray text-light cursor-not-allowed' : 'bg-orange'} text-light`}
          onClick={onConfirm}
          disabled={isConfirmDisabled}
        >
          Confirm Deposit
        </Button>
      </div>
    </div>
  );
};

export default ProofOfPayment;
