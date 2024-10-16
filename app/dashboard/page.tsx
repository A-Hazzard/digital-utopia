"use client";

import { Avatar, Button } from "@nextui-org/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName || user.email || "User");
      } else {
        setUsername("Guest");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={`h-screen bg-background flex`}>
      {/* Mobile Navbar */}
      <div className={`lg:hidden`}>
        <button onClick={() => setIsOpen(true)} className="p-2">
          {/* Custom Sandwich SVG Icon */}
          <svg
            className="text-light"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        {isOpen && (
          <div
            className={`fixed inset-0 bg-darker flex justify-center items-center lg:hidden`}
          >
            <div className={`w-full h-screen flex flex-col p-4`}>
              <button onClick={() => setIsOpen(false)}>
                {/* Custom Close SVG Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <ul className={`text-light flex flex-col gap-4 mt-8`}>
                <li>Dashboard</li>
                <li>Profile</li>
                <li>Payments</li>
                <li>Invoices</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Left Panel for Desktop */}
      <div className={`hidden lg:flex flex-col bg-darker p-4 w-64`}>
        <div className={`flex items-center mb-8`}>
          {/* Logo */}
          <div>Logo</div>
        </div>

        <ul className={`flex flex-col gap-6`}>
          <li>Dashboard</li>
          <li>Profile</li>
          <li>Payments</li>
          <li>Invoices</li>
        </ul>
      </div>

      {/* Main Content */}
      <main className={`flex flex-col gap-4 pt-10 pr-8 lg:p-8`}>
        <div className="w-3/12">
          <Avatar
            src="/avatar.svg"
            alt="Dashboard Placeholder"
            className="w-full h-auto"
          />
        </div>
        <h1 className="text-light text-2xl font-bold">
          WELCOME BACK TO UTOPIA Mr. {username}.
        </h1>
        <div className="flex flex-col lg:flex-row gap-4">
          
          <div>
            <p className="text-gray">Your Profits</p>
            <div className="flex items-center gap-2">
              <span className="text-light text-2xl font-bold">
                $40,000 USDT
              </span>
              <Image
                src="/usdt.svg"
                alt="USDT ICON"
                className="inline"
                width={15}
                height={15}
              />
            </div>
            <div className="flex items-center gap-2">
              <Image
                src="/uptrend.svg"
                alt="Uptrend Icon"
                width={20}
                height={20}
              />
              <p className="text-[#00BA3E]">+6.9%</p>
              <p className="text-gray">past month</p>
            </div>
          </div>

          <div>
            <p className="text-gray">Investment</p>
            <div className="flex items-center gap-2">
              <span className="text-light text-2xl font-bold">
                $10,000 USDT
              </span>
              <Image
                src="/usdt.svg"
                alt="USDT ICON"
                className="inline"
                width={15}
                height={15}
              />
            </div>
            
          </div>

          <div className="flex flex-col justify-center gap-4">
            <Button className="flex p-6 items-center gap-2 bg-orange text-light">
                <Image src="/plusButton.svg" alt="Plus Icon" width={20} height={20} />
                Deposit Funds
            </Button>
            <Button className="flex p-6 items-center gap-2 bg-gray text-light">
                <Image src="/minusButton.svg" alt="Minus Icon" width={20} height={20} />
                Deposit Funds
            </Button>
          </div>

        </div>
        <hr className="border-gray" />
      </main>
    </div>
  );
}
