import { auth } from "../lib/firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

export const sendSignInLink = async (email: string) => {
  const currentDomain = window.location.origin;
  
  const actionCodeSettings = {
    url: `${currentDomain}/login`,
    handleCodeInApp: true,
  };

  try {
    const validDomains = [
      "https://www.digitalutopia.app",
      "https://digitalutopia.app",
      "https://www.digital-utopia.vercel.app",
      "https://digital-utopia.vercel.app",
      "http://localhost:3000",
      "localhost:3000"
    ];
    
    if (!validDomains.includes(currentDomain)) {
      throw new Error("Invalid domain for authentication");
    }

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

