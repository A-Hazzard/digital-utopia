"use client"
import { useProfileModal } from "@/context/ProfileModalContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { auth } from "@/lib/firebase";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

export default function Panel() {
  const pathname = usePathname();
  const { isOpen, openModal, closeModal } = useProfileModal();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      // Check if the user's email matches the admin email from the environment variable
      setIsAdmin(user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);
    }
  }, []);

  return (
    <div className="text-light flex flex-col gap-6 h-full relative">
      <div className="w-full h-auto">
        <Image
          src="/whiteLogo.svg"
          className="w-full h-auto"
          alt="Logo"
          width={32}
          height={32}
        />
      </div>

      <ul className="flex flex-col gap-4">
        {!isAdmin && (
          <>
            <Link
              href="/dashboard"
            className={pathname === "/dashboard" ? "underline" : ""}
          >
            Dashboard
          </Link>

          <Link
          href="/invoices"
          className={`text-lg text-light ${
            pathname === "/invoices" ? "underline font-bold" : ""
            }`}
          >
            Invoices
          </Link>
          </>
        )}

        <button className="bg-none inline w-fit" onClick={openModal}>
          Profile
        </button>
        

        {/* Conditionally render admin links based on user's email */}
        {isAdmin && (
          <>
            <Link
              href="/admin/invoices"
              className={pathname === "/admin/invoices" ? "underline" : ""}
            >
              Invoices
            </Link>

            <Link
              href="/admin/deposits"
              className={pathname === "/admin/deposits" ? "underline" : ""}
            >
              Deposits
            </Link>

            <Link
              href="/admin/withdrawals"
              className={pathname === "/admin/withdrawals" ? "underline" : ""}
            >
              Withdrawals
            </Link>

            <Link
              href="/admin/payments"
              className={pathname === "/admin/payments" ? "underline" : ""}
            >
              Payments
            </Link>

            <Link
              href="/admin/trades"
              className={pathname === "/admin/trades" ? "underline" : ""}
            >
              Trade Results
            </Link>

            <Link
              href="/admin/resources"
              className={pathname === "/admin/resources" ? "underline" : ""}
            >
              Resources
            </Link>
          </>
        )}
      </ul>

      <button
        className="bg-transparent w-fit text-light absolute bottom-0 left-0 flex items-center gap-2"
        onClick={handleSignOut}
      >
        <LogOut size={20} />
        Sign Out
      </button>
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
    </div>
  );
};
