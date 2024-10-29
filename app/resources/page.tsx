"use client";

import Layout from "@/app/common/Layout";
import { auth, db } from "@/lib/firebase";
import { Button, Card, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Spinner } from "@nextui-org/react";
import { User } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Resource = {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string;
  categories: string[];
  type: string;
  thumbnailUrl: string;
}

type Category = {
  id: string;
  category: string;
}

const animationVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 }
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchResources();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchResources = () => {
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
  };

  useEffect(() => {
    const categoriesCollection = collection(db, "categories");
    const unsubscribe = onSnapshot(categoriesCollection, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        category: doc.data().category,
      })) as Category[];
      setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];

      const categoryNameToIdMap = categories.reduce((map, category) => {
        map[category.category] = category.id;
        return map;
      }, {} as Record<string, string>);

      const selectedCategoryIds = selectedCategories.map(name => categoryNameToIdMap[name]);

      const filteredResources = resourcesData.filter(resource => {
        const matchesSearchQuery = resource.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategoryIds.length === 0 || resource.categories.some(categoryId => selectedCategoryIds.includes(categoryId));
        return matchesSearchQuery && matchesCategory;
      });

      setResources(filteredResources);
    });

    return () => unsubscribe();
  }, [searchQuery, selectedCategories, categories]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prevSelected =>
      prevSelected.includes(category)
        ? prevSelected.filter(c => c !== category)
        : [...prevSelected, category]
    );
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  function getYoutubeVideoId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : "";
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6 text-light">
        <motion.h1 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold mb-8 text-center"
        >
          Trading Resources
        </motion.h1>
  
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-darker p-6 rounded-xl border border-readonly/30 mb-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <Input
              type="text"
              placeholder="Search by title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
              classNames={{
                input: "bg-dark text-light",
                label: "text-gray"
              }}
            />
            <Dropdown isOpen={isDropdownOpen}>
              <DropdownTrigger>
                <Button onClick={toggleDropdown} className="bg-orange hover:bg-orange/90">
                  Filter by Category
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                {categories.map((category) => (
                  <motion.div key={category.id} initial="hidden" animate="visible" variants={animationVariants}>
                    <DropdownItem className="category-chip">
                      <input
                        type="checkbox"
                        id={category.id}
                        value={category.category}
                        checked={selectedCategories.includes(category.category)}
                        onChange={() => handleCategoryChange(category.category)}
                        className="mb-1 mr-1"
                      />
                      <label htmlFor={category.id} className="text-light">
                        {category.category}
                      </label>
                    </DropdownItem>
                  </motion.div>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </motion.div>
  
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {resources.map((resource) => (
            <motion.div key={resource.id} variants={animationVariants}>
              <Card className="bg-darker hover:bg-dark/80 transition-colors duration-300 border border-readonly/30">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4">{resource.title}</h3>
                  <div className="aspect-w-16 aspect-h-9 mb-4 rounded-lg overflow-hidden">
                    {resource.type === "document" || resource.type === "article" ? (
                      <img
                        src={resource.thumbnailUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <iframe
                        src={`https://www.youtube.com/embed/${getYoutubeVideoId(resource.youtubeUrl)}?enablejsapi=1&origin=${window.location.origin}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full"
                      ></iframe>
                    )}
                  </div>
                  <p className="text-gray mb-4">{resource.description}</p>
                  <Button 
                    className="bg-orange hover:bg-orange/90 w-full"
                    onClick={() => window.open(resource.youtubeUrl, "_blank")}
                  >
                    {resource.type === "article" 
                      ? "Read Article" 
                      : resource.type === "document" 
                      ? "Download Document" 
                      : "Watch on YouTube"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}

{resources.length === 0 && (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="col-span-full flex flex-col items-center justify-center p-12 bg-darker rounded-xl border border-readonly/30"
  >
    <h3 className="text-2xl font-bold text-light mb-2">No Resources Available</h3>
    <p className="text-gray text-center">Check back later for new trading resources and educational content.</p>
  </motion.div>
)}

        </motion.div>
      </div>
    </Layout>
  );
  
}
