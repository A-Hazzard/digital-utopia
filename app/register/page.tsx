"use client";

import { Button, Input } from "@nextui-org/react";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import styles from "./register.module.css";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(""); // State for error messages
  const router = useRouter(); // Initialize useRouter
  const [user, setUser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false); // State to track loading status
  const [isPageLoading, setIsPageLoading] = useState(true); // State to track page loading status
        
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true
    setError(""); // Reset error message
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/"); // Redirect to home
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check for specific error message
        if (
          error.message.includes("invalid-email") ||
          error.message.includes("weak-password")
        ) {
          setError("Please provide valid credentials."); // Disable specific error messages
        } else {
          setError("An error occurred. Please try again."); // General error message
        }
        console.error("Error registering user:", error);
      } else {
        setError("An unknown error occurred"); // Fallback error message
        console.error("Unknown error registering user:", error);
      }
    } finally {
      setIsLoading(false); // Reset loading status
    }
  };

   useEffect(() => {
     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
       if (currentUser) {
         setUser(true); // User is signed in
         router.push("/"); // Redirect to home
       } else {
         setUser(false); // User is signed out
         setIsPageLoading(false); // Set page loading to false
       }
     });

     return () => unsubscribe(); // Cleanup subscription on unmount
   }, [router]);

  if (!user && isPageLoading) {
    return null;
  }
//TODO MAKE INTO A LAYOUT COMPONENT
  return (
    <div className="flex flex-col lg:flex-row-reverse text-dark lg:h-screen">
      <section className="lg:w-1/2 flex flex-col justify-start px-5 pt-20 2xl:pt-32">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="digital utopia logo"
            className="w-60 2xl:w-80"
            width={100}
            height={100}
          />
        </Link>

        <div className="w-full 2xl:w-4/12 mt-8">
          <h1 className="text-xl mb-8 text-dark 2xl:text-3xl">
            Let&apos;s Get You Registered!
          </h1>

          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-2 2xl:gap-4"
          >
            <div>
              <Input
                label="Name"
                labelPlacement="outside"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="2xl:text-xl"
              />
            </div>
            <div>
              <Input
                label="Email"
                type="email"
                labelPlacement="outside"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="2xl:text-xl"
              />
            </div>
            <div>
              <Input
                label="Password"
                type="password"
                labelPlacement="outside"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="2xl:text-xl"
              />
            </div>
            {error && <p className="text-red-500 2xl:text-lg">{error}</p>}

            <Button
              type="submit"
              className="mt-2 w-full bg-dark text-light 2xl:text-xl 2xl:py-3"
              isLoading={isLoading}
            >
              Register
            </Button>
          </form>

          <p className="mt-4 text-dark 2xl:text-lg 2xl:mt-6">
            Already have an account?
            <a
              href="/login"
              className="text-orange underline ml-1 hover:text-opacity-80"
            >
              Login
            </a>
          </p>
        </div>
      </section>

      <section
        className={`relative overflow-hidden h-[60vh] pt-10 mt-10 lg:mt-0 lg:h-screen lg:w-1/2 xl:pt-24 bg-dark ${styles.diagonalLines}`}
      >
        <div className="ml-4 md:ml-20 xl:ml-32 relative z-10">
          <h2 className="text-xl text-light 2xl:text-3xl">
            - Dive in, to boost your portfolio
          </h2>
          <p className="text-sm text-light 2xl:text-xl">
            your gateway to financial independence and profitable trading
          </p>
        </div>
        <Image
          src="/dashboard.svg"
          alt="dashboard preview"
          className="w-full mt-10 ml-40 xl:ml-60 relative z-10"
          width={100}
          height={100}
        />
      </section>
    </div>
  );
}
