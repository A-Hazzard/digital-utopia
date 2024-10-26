"use client";
import { sendSignInLink } from "@/helpers/auth";
import { db } from "@/lib/firebase";
import { Button, Input, Spinner } from "@nextui-org/react";
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import styles from "./login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<boolean | null>(null);
  const [isPasswordLogin, setIsPasswordLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // Check if the user account is disabled
      const userQuery = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        if (userDoc.isDisabled) {
          setError("Your account is disabled. Please contact support.");
          setIsLoading(false);
          return; // Exit if the account is disabled
        }
      }

      // Proceed with login if the account is not disabled
      if (isPasswordLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
      } else {
        window.localStorage.setItem("emailForSignIn", email);
        await sendSignInLink(email);
        setError("Check your email for the login link.");
      }
    } catch (error) {
      let errorMessage = "An error occurred. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("auth/invalid-credential")) {
          errorMessage = "Invalid email or password. Please try again.";
        }
      }
      setError(errorMessage);
      console.error("Error logging in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkEmailSignInLink = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem("emailForSignIn");
        if (!email) {
          email = window.prompt("Please provide your email for confirmation");
        }
        try {
          await signInWithEmailLink(auth, email || "", window.location.href);
          window.localStorage.removeItem("emailForSignIn");
          router.push("/");
        } catch (error) {
          console.error("Error signing in with email link:", error);
          setError("Failed to sign in with email link. Please try again.");
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push("/");
      } else {
        setUser(false);
        setIsPageLoading(false);
        checkEmailSignInLink();
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user && isPageLoading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="md" />
        </div>
    );
  }

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
            Let&apos;s Get You Back On Track!
          </h1>

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-6 2xl:gap-8"
          >
            <div>
              <Input
                isClearable
                label="Email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="2xl:text-xl"
              />
            </div>

            {isPasswordLogin && (
              <div>
                <Input
                  isClearable
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="2xl:text-xl"
                />
              </div>
            )}

            {error && <p className="text-red-500 2xl:text-lg">{error}</p>}

            <p className="-mt-4 text-sm text-dark 2xl:text-lg">
              <Link
                href="/forgot-password"
                className="text-orange hover:text-opacity-80"
              >
                Forgot your password?
              </Link>
            </p>
            <Button
              type="submit"
              className="w-full bg-darker text-light py-2 px-4 rounded-md hover:bg-opacity-90 transition duration-300 2xl:text-xl 2xl:py-3"
              isLoading={isLoading}
            >
              {isPasswordLogin ? "Login" : "Send Email Link"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-dark 2xl:text-lg 2xl:mt-6">
            {isPasswordLogin
              ? "Want to log in without a password?"
              : "Want to log in with a password?"}
            <button
              onClick={() => setIsPasswordLogin(!isPasswordLogin)}
              className="text-orange underline ml-1 hover:text-opacity-80"
            >
              {isPasswordLogin ? "Use Email Link" : "Use Password"}
            </button>
          </p>
          <p className="mt-4 text-dark 2xl:text-lg 2xl:mt-6">
            Don&apos;t have an account?
            <a
              href="/register"
              className="text-orange underline ml-1 hover:text-opacity-80"
            >
              Register
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
