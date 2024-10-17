"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="text-lightflex items-center gap-6">
      <Link
        href="/dashboard"
        className={pathname === "/dashboard" ? "underline" : ""}
      >
        Dashboard
      </Link>
      <Link
        href="/profile"
        className={pathname === "/profile" ? "underline" : ""}
      >
        Profile
      </Link>
      <Link
        href="/payments"
        className={pathname === "/payments" ? "underline" : ""}
      >
        Payments
      </Link>
      <Link
        href="/invoices"
        className={pathname === "/invoices" ? "underline" : ""}
      >
        Invoices
      </Link>
    </nav>
  );
};

export default Navbar;
