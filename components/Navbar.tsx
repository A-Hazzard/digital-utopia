"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useProfileModal } from "@/context/ProfileModalContext";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const Navbar = () => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { isOpen, openModal, closeModal } = useProfileModal();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); 
  const [loading, setLoading] = useState(true); 

  const toggleNavbar = () => {
    setIsNavOpen(!isNavOpen);
  };

  const handleProfileClick = () => {
    openModal();
    setIsNavOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
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
    <div>
      <div className="absolute top-4 left-4 z-30 lg:hidden">
        <Menu onClick={toggleNavbar} className="cursor-pointer text-light" />
      </div>

      <div
        className={`fixed inset-0 bg-darker flex flex-col items-center justify-center z-40 transition-opacity duration-300 ${
          isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ transition: "opacity 0.3s ease-in-out" }}
      >
        {isNavOpen && (
          <>
            <X
              onClick={toggleNavbar}
              className="absolute top-4 right-4 cursor-pointer text-light"
            />
            <nav className="flex flex-col items-center gap-4">
              {!isAdmin && (
                <Link
                  href="/"
                  className={`text-lg text-light ${
                    pathname === "/" ? "underline font-bold" : ""
                  }`}
                  onClick={toggleNavbar}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/resources"
                className={`text-lg text-light ${
                  pathname === "/resources" ? "underline font-bold" : ""
                }`}
                onClick={toggleNavbar}
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
                    onClick={toggleNavbar}
                  >
                    Invoices
                  </Link>
                  <Link
                    href="/withdrawals"
                    className={`text-lg text-light ${
                      pathname === "/withdrawals" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
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
                    className={`text-lg text-light ${
                      pathname === "/admin/user-management" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    User Management
                  </Link>
                  <Link
                    href="/admin/invoices"
                    className={`text-lg text-light ${
                      pathname === "/admin/invoices" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Invoices
                  </Link>
                  <Link
                    href="/admin/deposits"
                    className={`text-lg text-light ${
                      pathname === "/admin/deposits" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Deposits
                  </Link>
                  <Link
                    href="/admin/withdrawals"
                    className={`text-lg text-light ${
                      pathname === "/admin/withdrawals" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Withdrawals
                  </Link>
                  <Link
                    href="/admin/trades"
                    className={`text-lg text-light ${
                      pathname === "/admin/trades" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Trade Results
                  </Link>
                  <Link
                    href="/admin/manage-resources"
                    className={`text-lg text-light ${
                      pathname === "/admin/manage-resources" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Manage Resources
                  </Link>
                </>
              )}
              <div className="w-full border-t border-gray my-2"></div>
              <div className="flex flex-col items-center gap-4">
                <button
                  className="bg-none text-light inline w-fit"
                  onClick={handleProfileClick}
                >
                  Profile
                </button>
                <button
                  className="-ml-6 flex items-center gap-2 text-light"
                  onClick={handleSignOut}
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
    </div>
  );
};

export default Navbar;
