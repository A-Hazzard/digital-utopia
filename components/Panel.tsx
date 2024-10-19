"use client"
import { useProfileModal } from "@/context/ProfileModalContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { auth } from "@/lib/firebase";
import { LogOut } from "lucide-react";

export default function Panel() {
  const pathname = usePathname();
  const { isOpen, openModal, closeModal } = useProfileModal();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
        <Link
          href="/dashboard"
          className={pathname === "/dashboard" ? "underline" : ""}
        >
          Dashboard
        </Link>

        <button className="bg-none inline w-fit" onClick={openModal}>
          Profile
        </button>

        <Link
          href="/invoices"
          className={pathname === "/invoices" ? "underline" : ""}
        >
          Invoices
        </Link>
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
