"use client";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";

const Home = () => {
  const router = useRouter();

  return (
    <>
      <div>
        <h1>Welcome to Digital Utopia! Landing Page In Progress</h1>
        <Button
          onClick={() => router.push("/login")}
          className="bg-dark text-light py-2 px-4 rounded"
        >
          Login
        </Button>
      </div>
    </>
  );
};

export default Home;