"use client";

import { db } from "@/lib/firebase";
import { Button, Input, Spinner } from "@nextui-org/react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  User
} from "firebase/auth";
import { addDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import styles from "./register.module.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const emailResponse = await fetch('/api/sendRegistrationEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: name, email }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send email');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: name });

        await addDoc(collection(db, "users"), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          createdAt: new Date(),
          isDisabled: false, 
          isAdmin: false
        });

        if (user.email) {
          await createInvoice(user.uid, user.email);
        }
      }

      router.push("/");
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Failed to send email') {
          setError("Failed to send registration email. Please try again.");
        } else if (
          error.message.includes("invalid-email") ||
          error.message.includes("weak-password")
        ) {
          setError("Please provide valid credentials.");
        } else {
          setError("An error occurred. Please try again.");
        }
        console.error("Error registering user:", error);
      } else {
        setError("An unknown error occurred");
        console.error("Unknown error registering user:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

   useEffect(() => {
     const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
       if (!user) setIsPageLoading(false);
       else console.log(user)
       
     });

     return () => unsubscribe();
   }, [router]);

  if (isPageLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
    );
  }

  const createInvoice = async (userId: string, userEmail: string) => {
    const invoicesRef = collection(db, "invoices");
    const querySnapshot = await getDocs(invoicesRef);
    const invoiceCount = querySnapshot.size; 
    const invoiceNumber = `INV-${invoiceCount + 1}`; 

    const invoiceData = {
      invoiceNumber: invoiceNumber,
      description: "Monthly Subscription Fee",
      amount: "70 USDT",
      date: new Date().toISOString(),
      status: "pending",
      userId: userId,
      userEmail: userEmail,
      createdAt: Timestamp.now(),
      userName: name,
      country: "User's Country",
    };

    await addDoc(invoicesRef, invoiceData); 
  };

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
                type="text"
                labelPlacement="outside"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="2xl:text-xl"
                autoComplete="name"
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
