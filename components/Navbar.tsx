"use client"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { useProfileModal } from "@/context/ProfileModalContext";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { auth } from "@/lib/firebase";

const Navbar = () => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { isOpen, openModal, closeModal } = useProfileModal();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

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
              <button
                className="bg-none text-light inline w-fit"
                onClick={handleProfileClick}
              >
                Profile
              </button>

              {/* Conditionally render admin links based on user's email */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/invoices"
                    className={`text-lg text-light ${
                      pathname === "/admin/invoices"
                        ? "underline font-bold"
                        : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Invoices
                  </Link>
                  <Link
                    href="/admin/deposits"
                    className={`text-lg text-light ${
                      pathname === "/admin/deposits"
                        ? "underline font-bold"
                        : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Deposits
                  </Link>
                  <Link
                    href="/admin/withdrawals"
                    className={`text-lg text-light ${
                      pathname === "/admin/withdrawals"
                        ? "underline font-bold"
                        : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Withdrawals
                  </Link>
                  <Link
                    href="/admin/payments"
                    className={`text-lg text-light ${
                      pathname === "/admin/payments"
                        ? "underline font-bold"
                        : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Payments
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
                    href="/admin/resources"
                    className={`text-lg text-light ${
                      pathname === "/admin/resources"
                        ? "underline font-bold"
                        : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Resources
                  </Link>
                </>
              )}
              <button
                className="flex items-center gap-2 text-light"
                onClick={handleSignOut}
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </nav>
          </>
        )}
      </div>
      {isOpen && <ProfileSettingsModal onClose={closeModal} />}
    </div>
  );
};

export default Navbar;
