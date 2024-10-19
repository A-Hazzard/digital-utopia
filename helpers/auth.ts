import { auth } from "../lib/firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

export const sendSignInLink = async (email: string) => {
  const actionCodeSettings = {
    url:
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000/login"
        : "https://digitalutopia.vercel.app/login",
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", email);
    alert("Check your email for the sign-in link!");
  } catch (error) {
    console.error("Error sending email link:", error);
  }
};

export const completeSignIn = async (email: string) => {
  const emailLink = window.location.href;

  if (isSignInWithEmailLink(auth, emailLink)) {
    try {
      const result = await signInWithEmailLink(auth, email, emailLink);
      console.log("User signed in:", result);
    } catch (error) {
      console.error("Error signing in with email link:", error);
    }
  }
};
