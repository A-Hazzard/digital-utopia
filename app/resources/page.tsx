"use client";

import Layout from "@/app/common/Layout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Spinner } from "@nextui-org/react";

interface Resource {
  id: string;
  title: string;
  youtubeUrl: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];
      setResources(resourcesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 text-light">
        <h1 className="text-2xl font-bold mb-4">
          Trading Resources
        </h1>
        <div className="flex flex-wrap gap-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5"
            >
              <h2 className="text-lg font-semibold mb-2">{resource.title}</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(
                    resource.youtubeUrl
                  )}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full rounded-lg"
                ></iframe>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function getYoutubeVideoId(url: string): string {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}
