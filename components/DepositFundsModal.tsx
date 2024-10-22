"use client";
import { Button, Input } from "@nextui-org/react";
import { InfoIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "../lib/firebase"; // Import your Firebase auth configuration
import CustomInput from "./CustomInput";
import ProofOfPayment from "./ProofOfPayment";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // Add this import

interface DepositFundsModalProps {
  onClose: () => void; 
}

const DepositFundsModal: React.FC<DepositFundsModalProps> = ({ onClose }) => {
  const [showTooltip, setShowTooltip] = useState(false); 
  const [showProofOfPayment, setShowProofOfPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const userId = auth.currentUser?.uid;

  const handleClick = () => {
    setShowTooltip((prev) => !prev);
  };

  const handleProofOfTransaction = async () => {
    if (!userId) {
      console.error("User ID is undefined");
      return;
    }

    // Create or update wallet document
    const walletRef = doc(db, "wallets", userId);
    const walletDoc = await getDoc(walletRef);
    
    if (!walletDoc.exists()) {
      await setDoc(walletRef, { balance: 0 });
    }

    setShowProofOfPayment(true);
  };

  const handleBack = () => {
    setShowProofOfPayment(false);
  };
  

  if (!userId) return null;

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark text-light p-6 rounded-lg w-full h-full md:w-auto md:h-auto md:max-w-md flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Deposit Crypto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-light text-2xl"
            >
              &times;
            </button>
          </div>

          <div
            className={`transition-opacity duration-300 ${
              showProofOfPayment
                ? "opacity-0 h-0 overflow-hidden"
                : "opacity-100"
            }`}
          >
            {/* Original content */}
            <div className="space-y-4 flex-grow overflow-y-auto">
              <div>
                <label className="block mb-1">Currency</label>
                <CustomInput
                  icon="/usdt.svg"
                  altText="USDT Icon"
                  mainText="USDT"
                  subText="Tether"
                />
              </div>

              <div>
                <label className="block mb-1">Network</label>
                <CustomInput
                  icon="/trx.svg"
                  altText="TRX Icon"
                  mainText="TRX"
                  subText="Tron TRC20"
                />
              </div>

              <div className="p-4 border border-gray rounded md:flex md:items-start md:space-x-4">
                <div className="md:flex-shrink-0">
                  <QRCodeSVG
                    value="TNUT4394NUN439TUN9GFNUSG9NFGFGFIOJ4094MM"
                    size={128}
                  />
                </div>

                <div className="mt-2 md:mt-0 md:flex-grow">
                  <div className="text-gray">Tron (TRC 20)</div>
                  <div className="text-light break-all">
                    TNUT4394NUN439TUN9GFNUSG9NFGFGFIOJ4094MM
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <div>
                  <p>Minimum deposit amount</p>
                  {showTooltip && (
                    <div className="absolute bg-orange text-light text-sm p-2 rounded mt-8 z-20 w-52">
                      This fee applies only if you are not using Binance. If you
                      are using Binance, you can send to UID 1234, which will
                      incur no fee.
                    </div>
                  )}
                  <p className="flex items-center gap-2">
                    Gas Fee{" "}
                    <InfoIcon
                      onClick={handleClick}
                      size={16}
                      className="cursor-pointer bg-gray text-darker rounded-full"
                    />{" "}
                  </p>
                </div>
                <div>
                  <p className="text-light">20.00 USDT</p>

                  <p className="text-light">1.00 USDT </p>
                </div>
              </div>

              <Input
                type="number"
                label="Deposit Amount"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mb-2"
              />
            </div>
          </div>

          <div
            className={`transition-opacity duration-300 ${
              showProofOfPayment
                ? "opacity-100"
                : "opacity-0 h-0 overflow-hidden"
            }`}
          >
            <ProofOfPayment
              purpose="deposit"
              onBack={handleBack}
              userId={userId}
              amount={amount}
            />
          </div>

          {!showProofOfPayment && (
            <div className="mt-6 flex justify-end">
              <Button
                className="w-fit bg-orange text-light"
                onClick={handleProofOfTransaction}
              >
                Proof of Transaction
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DepositFundsModal;
