"use client";
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // Use null for loading state
  const [loading, setLoading] = useState(true); // Loading state

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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAdmin(
          user.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL1 ||
            user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL2 ||
            user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL3)
        );
      } else {
        setIsAdmin(false); // Reset if no user is logged in
      }
      setLoading(false); // Set loading to false after checking
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Show a loading state while checking authentication
  if (loading) {
    return null; // You can customize this loading state
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
              <Link
                href="/"
                className={`text-lg text-light ${
                  pathname === "/" ? "underline font-bold" : ""
                }`}
                onClick={toggleNavbar}
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
              <Link
                href="/resources"
                className={`text-lg text-light ${
                  pathname === "/resources" ? "underline font-bold" : ""
                }`}
                onClick={toggleNavbar}
              >
                Resources
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/admin/manage-resources"
                    className={`text-lg text-light ${
                      pathname === "/admin/manage-resources"
                        ? "underline font-bold"
                        : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Manage Resources
                  </Link>
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
                    href="/admin/trades"
                    className={`text-lg text-light ${
                      pathname === "/admin/trades" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    Trade Results
                  </Link>
                  <Link
                    href="/admin/user-management"
                    className={`text-lg text-light ${
                      pathname === "/admin/user-management" ? "underline font-bold" : ""
                    }`}
                    onClick={toggleNavbar}
                  >
                    User Management
                  </Link>
                </>
              )}
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
