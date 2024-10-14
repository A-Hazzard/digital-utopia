// src/helpers/auth.ts
import { auth } from "../firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

export const sendSignInLink = async (email: string) => {
  const actionCodeSettings = {
    // URL you want to redirect back to after email link is clicked
    url: process.env.NODE_ENV === 'development' 
      ? "http://localhost:3000/login"
      : "https://digitalutopia.vercel.app/login",
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email locally to complete sign-in later
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
      // Redirect or perform additional actions after sign-in
    } catch (error) {
      console.error("Error signing in with email link:", error);
    }
  }
};
