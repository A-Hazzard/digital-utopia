"use client";

import { Button, Input } from "@nextui-org/react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "../../firebase";
import Image from "next/image";
import Link from "next/link";
import styles from "./forgot-password.module.css"; // Assuming you want to create a CSS module for styles

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("If your email is found a password reset link will be sent to it.");
      router.push("/login"); // Redirect to login after sending the email
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("auth/invalid-email")) {
          errorMessage = "Invalid email address. Please check and try again.";
        } else if (error.message.includes("auth/user-not-found")) {
          errorMessage = "No user found with this email address.";
        }
      }
      setError(errorMessage);
      console.error("Error sending password reset email:", error);
    } finally {
      setIsLoading(false);
    }
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

        <div className="w-full mt-8 ">
          <h1 className="text-xl mb-8 text-dark 2xl:text-3xl">
            Reset Your Password
          </h1>

          <form onSubmit={handleResetPassword} className="flex flex-col gap-6 2xl:gap-8">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="2xl:text-xl"
            />
            {error && <p className="text-red-500 2xl:text-lg">{error}</p>}
            <Button type="submit" isLoading={isLoading} className="w-full bg-darker text-light py-2 px-4 rounded-md hover:bg-opacity-90 transition duration-300 2xl:text-xl 2xl:py-3">
              Send Reset Link
            </Button>
          </form>

          <p className="mt-4 text-sm text-dark 2xl:text-lg 2xl:mt-6">
            Remembered your password? 
            <Link href="/login" className="text-orange underline ml-1 hover:text-opacity-80">
              Log in
            </Link>
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
