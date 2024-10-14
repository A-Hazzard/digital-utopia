"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation"; // Import useRouter
import Link from "next/link";
import { Button, Input } from "@nextui-org/react"; // Import NextUI Input
import { sendSignInLink } from "@/helpers/auth";

export default function page() {
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
        router.push("/"); // Redirect to home only if login is successful
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

  // Render the login form if the user is not authenticated
  if (!user && isPageLoading) {
    return null; // Optionally, you can show a loading spinner here
  }

  return (
    <div className="mt-8 text-dark">
      <section className="flex flex-col justify-start p-5">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="digital utopia logo"
            className="w-60"
            width={100}
            height={100}
          />
        </Link>

        <div className="w-full mt-8">
          <h1 className="text-xl mb-8 text-dark">
            Let's Get You Back On Track!
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                isClearable
                label="Email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                />
              </div>
            )}
            {error && <p className="text-red-500">{error}</p>}{" "}
            {/* Display error message */}
            <Button
              type="submit"
              className="w-full bg-darker text-light py-2 px-4 rounded-md hover:bg-opacity-90 transition duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-light rounded-full animate-spin mr-2"></div>
                  Loading...
                </div>
              ) : isPasswordLogin ? (
                "Login"
              ) : (
                "Send Email Link"
              )}
            </Button>
          </form>
          <p className="mt-4 text-sm text-dark">
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
          <p className="mt-4 text-dark">
            Don't have an account?
            <a
              href="/register"
              className="text-orange underline ml-1 hover:text-opacity-80"
            >
              Register
            </a>
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden h-[60vh] pt-20 bg-dark">
        <Image
          src="/dashboard.svg"
          alt="dashboard preview"
          className="w-full ml-40"
          width={100}
          height={100}
        />
      </section>
    </div>
  );
}
