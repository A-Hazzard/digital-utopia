"use client"
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../firebase'; // Adjust the import path as necessary
import { useAuthRedirectForAuth } from '@/helpers/authRedirect';

const Home = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/login'); // Redirect to login after signing out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div>
      <h1>Welcome to Digital Utopia!</h1>
      <button onClick={handleSignOut} className="bg-red-500 text-white py-2 px-4 rounded">
        Sign Out
      </button>
    </div>
  );
};

export default Home;
