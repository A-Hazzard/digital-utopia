"use client";
import React, { useState, useEffect } from "react";
import { Button, Spinner } from "@nextui-org/react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomInput from "./CustomInput";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

interface WithdrawCryptoModalProps {
  onClose: () => void;
}

interface Trade {
  amount: number;
}

const WithdrawCryptoModal: React.FC<WithdrawCryptoModalProps> = ({
  onClose,
}) => {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isWithdrawEnabled, setIsWithdrawEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [fetchingBalance, setFetchingBalance] = useState(true);
  const userId = auth.currentUser?.uid;
  const username = auth.currentUser?.displayName || "";

  useEffect(() => {
    fetchTotalProfits();
  }, []);

  const fetchTotalProfits = async () => {
    setFetchingBalance(true);
    try {
      const userEmail = auth.currentUser?.email;
      const tradesCollection = collection(db, "trades");
      const q = query(tradesCollection, where("userEmail", "==", userEmail));
      const tradesSnapshot = await getDocs(q);

      const tradesData = tradesSnapshot.docs.map((doc) => doc.data() as Trade);
      const totalProfit = tradesData.reduce(
        (acc, trade) =>
          acc + (typeof trade.amount === "number" ? trade.amount : 0),
        0
      );
      setAvailableBalance(totalProfit);
    } catch (error) {
      console.error("Error fetching total profits:", error);
      toast.error("Failed to fetch available balance.");
    } finally {
      setFetchingBalance(false);
    }
  };

  const validateTRC20Address = (address: string) => {
    return /^T[A-Za-z1-9]{33}$/.test(address);
  };

  useEffect(() => {
    const isValidAddress = validateTRC20Address(address);
    const numericAmount = parseFloat(amount.replace(/,/g, ""));
    const isValidAmount =
      numericAmount >= 20 && numericAmount <= availableBalance;
    setIsWithdrawEnabled(isValidAddress && isValidAmount && isAddressConfirmed);
  }, [address, amount, isAddressConfirmed, availableBalance]);

  const handleConfirmAddress = () => {
    if (validateTRC20Address(address)) {
      setIsAddressConfirmed(true);
    } else {
      alert("Invalid TRC20 address");
    }
  };

  const handleChangeAddress = () => {
    setIsAddressConfirmed(false);
  };

  const handleSelectAll = () => {
    setAmount(formatAmount(availableBalance.toString()));
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const floatValue = parseFloat(numericValue);
    if (floatValue > availableBalance) {
      return availableBalance.toFixed(2);
    }
    return floatValue.toFixed(2);
  };

  const handleWithdraw = async () => {
    setLoading(true);
    const withdrawData = {
      userId,
      userEmail: auth.currentUser?.email,
      username,
      amount: parseFloat(amount),
      address,
      date: new Date(),
      status: "pending",
    };

    try {
      await addDoc(collection(db, "withdrawalRequests"), withdrawData);
      const response = await fetch("/api/sendWithdrawalEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withdrawData),
      });

      if (!response.ok) {
        throw new Error("Failed to send withdrawal notification email.");
      }

      toast.success(
        "Withdrawal request submitted! Funds will show up within 24 to 48 hours."
      );
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast.error("Failed to process withdrawal request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-dark text-light p-4 sm:p-6 rounded-lg w-full h-full md:w-auto md:h-auto md:max-w-md flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Withdraw Crypto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-light text-2xl"
            >
              &times;
            </button>
          </div>

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

            <h3 className="font-bold mt-4">Withdraw To</h3>
            <div className="border border-gray-600 rounded-lg p-4 space-y-4">
              <div>
                <label className="block mb-1">Address</label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    readOnly={isAddressConfirmed}
                    className={`text-sm w-full bg-transparent text-light border border-gray-600 rounded-lg p-2 pr-20 focus:outline-none ${
                      isAddressConfirmed
                        ? "bg-gray-700 cursor-not-allowed"
                        : "focus:border-orange"
                    }`}
                    placeholder="Confirm your wallet address"
                  />
                  <button
                    onClick={
                      isAddressConfirmed
                        ? handleChangeAddress
                        : handleConfirmAddress
                    }
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-[#3576FF] underline"
                  >
                    {isAddressConfirmed ? "Change" : "Confirm"}
                  </button>
                </div>
                <p className="text-[#FF0000] text-xs lg:text-sm mt-1">
                  Warning: Entering an incorrect address will result in your
                  funds being sent elsewhere. We are not responsible for any
                  lost funds.
                </p>
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

              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between mb-1">
                  <label>Amount</label>
                  <span className="text-sm text-gray-400">
                    Available Balance:{" "}
                    {fetchingBalance ? (
                      <Spinner size="sm" />
                    ) : (
                      `${availableBalance.toFixed(2)} USDT`
                    )}
                  </span>
                </div>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(formatAmount(e.target.value))}
                    className="text-sm w-full bg-transparent text-light border border-gray-600 rounded-lg p-2 pr-20 focus:outline-none focus:border-orange"
                    placeholder="Enter the quantity"
                  />
                  <button
                    onClick={handleSelectAll}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-[#3576FF] underline"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end">
              <div className="w-full sm:w-auto mb-2 sm:mb-0">
                <p className="text-gray text-sm">Minimum Withdraw Amount</p>
                <p className="text-light">20.00 USDT</p>
              </div>
              <Button
                className={`${
                  isWithdrawEnabled
                    ? "bg-orange text-light"
                    : "bg-transparent text-gray cursor-not-allowed"
                } w-fit self-end`}
                disabled={!isWithdrawEnabled || loading}
                onClick={handleWithdraw}
                isLoading={loading}
              >
                Withdraw Amount
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithdrawCryptoModal;
