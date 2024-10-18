"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react"; // Import icons from lucide-react
import { useProfileModal } from "@/context/ProfileModalContext";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { auth } from "@/lib/firebase"; // Import Firebase auth

const Navbar = () => {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false); // State to manage navbar visibility
  const { isOpen, openModal, closeModal } = useProfileModal();

  const toggleNavbar = () => {
    setIsNavOpen(!isNavOpen);
  };

  const handleProfileClick = () => {
    openModal(); // Open the profile modal
    setIsNavOpen(false); // Close the navbar
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut(); // Sign out the user
      // Optionally, you can redirect the user or show a message
    } catch (error) {
      console.error("Error signing out:", error); // Handle sign-out error
    }
  };

  return (
    <div>
      {/* Hamburger Icon */}
      <div className="absolute top-4 left-4 z-30 lg:hidden">
        <Menu onClick={toggleNavbar} className="cursor-pointer text-light" />
      </div>

      {/* Fullscreen Navbar Overlay */}
      <div
        className={`fixed inset-0 bg-darker flex flex-col items-center justify-center z-40 transition-opacity duration-300 ${
          isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ transition: "opacity 0.3s ease-in-out" }}
      >
        {isNavOpen && ( // Use isNavOpen to control visibility
          <>
            <X
              onClick={toggleNavbar}
              className="absolute top-4 right-4 cursor-pointer text-light"
            />
            <nav className="flex flex-col items-center gap-4">
              <Link
                href="/dashboard"
                className={`text-lg text-light ${
                  pathname === "/dashboard" ? "underline font-bold" : ""
                }`}
                onClick={toggleNavbar}
              >
                Dashboard
              </Link>
              <button className="bg-none text-light inline w-fit" onClick={handleProfileClick}>
                Profile
              </button>
              <Link
                href="/payments"
                className={`text-lg text-light ${
                  pathname === "/payments" ? "underline font-bold" : ""
                }`}
                onClick={toggleNavbar}
              >
                Payments
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
              {/* Sign Out Button */}
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
