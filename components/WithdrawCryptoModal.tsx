"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@nextui-org/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomInput from "./CustomInput";

interface WithdrawCryptoModalProps {
  onClose: () => void;
}

const WithdrawCryptoModal: React.FC<WithdrawCryptoModalProps> = ({ onClose }) => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [isWithdrawEnabled, setIsWithdrawEnabled] = useState(false);
  const availableBalance = 4000000; 

  const validateTRC20Address = (address: string) => {
    return /^T[A-Za-z1-9]{33}$/.test(address);
  };

  useEffect(() => {
    const isValidAddress = validateTRC20Address(address);
    const numericAmount = parseFloat(amount.replace(/,/g, '')) * 100; 
    const isValidAmount = numericAmount >= 2000 && numericAmount <= availableBalance;
    setIsWithdrawEnabled(isValidAddress && isValidAmount && isAddressConfirmed);
  }, [address, amount, isAddressConfirmed]);

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
    const numericValue = value.replace(/[^0-9]/g, '');
    const cents = parseInt(numericValue, 10);
    if (cents > availableBalance) {
      return formatAmount(availableBalance.toString());
    }
    return (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
                    className={`text-sm w-full bg-transparent text-light border border-gray-600 rounded-lg p-2 pr-20 focus:outline-none ${isAddressConfirmed ? 'bg-gray-700 cursor-not-allowed' : 'focus:border-orange'}`}
                    placeholder="Confirm your wallet address"
                  />
                  <button
                    onClick={isAddressConfirmed ? handleChangeAddress : handleConfirmAddress}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent text-[#3576FF] underline"
                  >
                    {isAddressConfirmed ? 'Change' : 'Confirm'}
                  </button>
                </div>
                <p className="text-[#FF0000] text-xs lg:text-sm mt-1">
                  Warning: Entering an incorrect address will result in your funds being sent elsewhere. We are not responsible for any lost funds.
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
                  <span className="text-sm text-gray-400">Available Balance: {formatAmount(availableBalance.toString())} USDT</span>
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
                    ? 'bg-orange text-light' 
                    : 'bg-transparent text-gray cursor-not-allowed'
                } w-fit self-end`}
                disabled={!isWithdrawEnabled}
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
