"use client";
import { useRouter } from "next/navigation";
import { Button } from "@nextui-org/react";
import { NextSeo } from "next-seo";

const Home = () => {
  const router = useRouter();

  return (
    <>
      <NextSeo
        title="Welcome to Digital Utopia"
        description="Join Digital Utopia to start your crypto journey and become a profitable trader."
        openGraph={{
          url: "https://digital-utopia.vercel.app",
          title: "Welcome to Digital Utopia",
          description:
            "Join Digital Utopia to start your crypto journey and become a profitable trader.",
          images: [
            {
              url: "https://digital-utopia.vercel.app/logo.svg",
              width: 800,
              height: 600,
              alt: "Digital Utopia",
            },
          ],
          site_name: "Digital Utopia",
        }}
      />
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