"use client";

import React, { useState } from "react";
import { Button } from "@nextui-org/react";
import Image from "next/image";
import ProofOfPayment from "./ProofOfPayment";
import { auth } from "@/lib/firebase"; // Import your Firebase auth configuration

type PaymentMethodProps = {
  onBack: () => void;
  invoiceNumber: string;
  amount: number;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ onBack, invoiceNumber, amount }) => {
  const [selectedMethod, setSelectedMethod] = useState<
    "bank" | "paypal" | null
  >(null);
  const [showProofOfPayment, setShowProofOfPayment] = useState(false);
  const [fade, setFade] = useState(false);
  const userId = auth.currentUser?.uid; 
  const handleMethodSelect = (method: "bank" | "paypal") => {
    setSelectedMethod(method);
  };

  const handleConfirmPayment = () => {
    setFade(true); 
    setTimeout(() => setShowProofOfPayment(true), 500);
  };
  if (!userId) return null;

  return (
    <div className="relative">
      {/* Payment Method Section */}
      {!showProofOfPayment && (
        <div
          className={`transition-opacity duration-500 ease-in-out ${
            fade ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={onBack}
              className="bg-gray text-light rounded px-2 py-1"
            >
              Back
            </button>
          </div>

          <p className="text-gray">Choose a payment method:</p>
          <div className="flex space-x-4 mt-2">
            <div
              className="cursor-pointer"
              onClick={() => handleMethodSelect("bank")}
            >
              <Image src="/bank.svg" alt="Bank" width={100} height={50} />
            </div>
            <div
              className="cursor-pointer"
              onClick={() => handleMethodSelect("paypal")}
            >
              <Image src="/paypal.svg" alt="PayPal" width={100} height={50} />
            </div>
          </div>

          {selectedMethod === "bank" && (
            <div className="mt-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full overflow-hidden w-[50px] h-[50px]">
                  <Image
                    src="/FCB.jpg"
                    alt="First Citizens Bank"
                    width={50}
                    height={50}
                    objectFit="cover"
                  />
                </div>
                <span className="text-gray">FCB</span>
              </div>
              <p className="text-gray">
                Name: Khaleel Malik Nickos Reid-Devonish
              </p>
              <p className="text-gray">Account #: 2482338</p>
            </div>
          )}

          {selectedMethod === "paypal" && (
            <div className="mt-4">
              <p className="text-gray">PayPal Link:</p>
              <a href="https://www.paypal.me/khalxl" className="text-blue-500">
                https://www.paypal.me/khalxl
              </a>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              className="bg-orange text-light"
              onClick={handleConfirmPayment}
            >
              Proof of Payment
            </Button>
          </div>
        </div>
      )}

      {showProofOfPayment && (
        <div className="transition-opacity duration-500 ease-in-out opacity-100">
          <ProofOfPayment
            onBack={() => {
              setShowProofOfPayment(false);
              setFade(false);
            }}
            purpose="invoice"
            invoiceNumber={invoiceNumber}
            amount={amount}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;
