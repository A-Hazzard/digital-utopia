"use client"
import { useProfileModal } from "@/context/ProfileModalContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { auth, db } from "@/lib/firebase";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Panel() {
  const pathname = usePathname();
  const { isOpen, openModal, closeModal } = useProfileModal();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setIsAdmin(userDoc.data().isAdmin || false);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return null;
  }

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
          <Link
            href="/"
            className={`text-lg text-light ${
              pathname === "/" ? "underline font-bold" : ""
            }`}
          >
            Dashboard
          </Link>
        )}

        <Link
          href="/resources"
          className={`text-lg text-light ${
            pathname === "/resources" ? "underline font-bold" : ""
          }`}
        >
          Resources
        </Link>

        {!isAdmin && (
          <>
            <Link
              href="/invoices"
              className={`text-lg text-light ${
                pathname === "/invoices" ? "underline font-bold" : ""
              }`}
            >
              Invoices
            </Link>
            <Link
              href="/withdrawals"
              className={`text-lg text-light ${
                pathname === "/withdrawals" ? "underline font-bold" : ""
              }`}
            >
              Withdrawals
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <div className="w-full border-t border-gray my-2"></div>
            <span className="text-gray text-sm">Admin Panel</span>
            
            <Link
              href="/admin/user-management"
              className={pathname === "/admin/user-management" ? "underline" : ""}
            >
              User Management
            </Link>
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
              href="/admin/trades"
              className={pathname === "/admin/trades" ? "underline" : ""}
            >
              Trade Results
            </Link>
            <Link
              href="/admin/manage-resources"
              className={pathname === "/admin/manage-resources" ? "underline" : ""}
            >
              Manage Resources
            </Link>
          </>
        )}
      </ul>

      <div className="mt-auto">
        <button className="bg-none inline w-fit mb-4" onClick={openModal}>
          Profile
        </button>
        <button
          className="bg-transparent w-fit text-light flex items-center gap-2"
          onClick={handleSignOut}
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
    </div>
  );
}
