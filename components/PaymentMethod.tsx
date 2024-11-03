"use client";

import { auth } from "@/lib/firebase";
import { Button } from "@nextui-org/react";
import { Copy } from "lucide-react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";
import ProofOfPayment from "./ProofOfPayment";

type PaymentMethodProps = {
  onBack: () => void;
  invoiceNumber: string;
  amount: number;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({ onBack, invoiceNumber, amount }) => {
  const [selectedMethod, setSelectedMethod] = useState<
    "bank" | "paypal" | "usdt" | null
  >(null);
  const [showProofOfPayment, setShowProofOfPayment] = useState(false);
  const [fade, setFade] = useState(false);
  const userId = auth.currentUser?.uid;

  const handleMethodSelect = (method: "bank" | "paypal" | "usdt") => {
    setSelectedMethod(method);
  };

  const handleConfirmPayment = () => {
    setFade(true);
    setTimeout(() => setShowProofOfPayment(true), 500);
  };

  if (!userId) return null;

  return (
    <div className="relative">
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
          <div className="flex items-center space-x-4 mt-2">
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
            <div
              className="cursor-pointer"
              onClick={() => handleMethodSelect("usdt")}
            >
              <Image src="/usdt.svg" alt="USDT" width={70} height={50} />
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

          {selectedMethod === "usdt" && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1">Currency</label>
                <div className="flex items-center space-x-2 p-2 border border-gray-600 rounded">
                  <Image src="/usdt.svg" alt="USDT Icon" width={24} height={24} />
                  <span className="text-light">USDT</span>
                  <span className="text-gray">Tether</span>
                </div>
              </div>

              <div>
                <label className="block mb-1">Network</label>
                <div className="flex items-center space-x-2 p-2 border border-gray-600 rounded">
                  <Image src="/trx.svg" alt="TRX Icon" width={24} height={24} />
                  <span className="text-light">TRX</span>
                  <span className="text-gray">Tron TRC20</span>
                </div>
              </div>

              <div className="p-4 border border-gray rounded md:flex md:items-start md:space-x-4">
                <div className="md:flex-shrink-0">
                  <QRCodeSVG
                    value="TY43pW2JjCSkczf2QNwCEaDrjC8UYDGEq2"
                    size={128}
                  />
                </div>

                <div className="mt-2 md:mt-0 md:flex-grow">
                  <div className="text-gray">Tron (TRC 20)</div>
                  <div className="text-light break-all flex items-center">
                    <span>TY43pW2JjCSkczf2QNwCEaDrjC8UYDGEq2</span>
                    <Copy
                      size={18}
                      className="ml-2 cursor-pointer"
                      onClick={() => navigator.clipboard.writeText("TY43pW2JjCSkczf2QNwCEaDrjC8UYDGEq2")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2 text-white">
                <span>Amount to Pay:</span>
                <span className="font-bold">70.00 USDT</span>
              </div>
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
