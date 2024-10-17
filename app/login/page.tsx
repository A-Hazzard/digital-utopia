"use client";
import { sendSignInLink } from "@/helpers/auth";
import { Button, Input } from "@nextui-org/react"; // Import NextUI Input
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithEmailLink,
} from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import styles from "./login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<boolean | null>(null);
  const [isPasswordLogin, setIsPasswordLogin] = useState(true); // State to toggle between login methods
  const [isLoading, setIsLoading] = useState(false); // State to track loading status
  const [isPageLoading, setIsPageLoading] = useState(true); // State to track page loading status
  const [error, setError] = useState(""); // State for error messages

  const router = useRouter(); // Initialize useRouter

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true); // Set loading to true
    setError(""); // Reset error message
    try {
      if (isPasswordLogin) {
        // Login with password
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard"); // Redirect to home only if login is successful
      } else {
        // Login with email link
        window.localStorage.setItem("emailForSignIn", email); // Store email for later use
        await sendSignInLink(email); // Function to send email link
        setError("Check your email for the login link."); // Inform the user
      }
    } catch (error) {
      let errorMessage = "An error occurred. Please try again."; // Default error message
      if (error instanceof Error) {
        // Customize error messages based on the error type
        if (error.message.includes("auth/invalid-credential")) {
          errorMessage = "Invalid email or password. Please try again."; // General error message for invalid credentials
        }
      }
      setError(errorMessage); // Set user-friendly error message
      console.error("Error logging in:", error);
    } finally {
      setIsLoading(false); // Reset loading status
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
          router.push("/dashboard"); // Redirect to home after successful email link sign-in
        } catch (error) {
          console.error("Error signing in with email link:", error);
          setError("Failed to sign in with email link. Please try again.");
        }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(true); // User is signed in
        router.push("/dashboard"); // Redirect to home
      } else {
        setUser(false); // User is signed out
        setIsPageLoading(false); // Set page loading to false
        checkEmailSignInLink(); // Check for email sign-in link
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  // Render the login form if the user is not authenticated
  if (!user && isPageLoading) {
    return null; // Optionally, you can show a loading spinner here
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
