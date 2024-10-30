"use client";

import Layout from "@/app/common/Layout";
import { auth, db } from "@/lib/firebase";
import { Button, Card, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Spinner, Checkbox } from "@nextui-org/react";
import { User } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";

type Resource = {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string;
  categories: string[];
  type: string;
  thumbnailUrl: string;
  resourceLink?: string;
  documentUrl?: string;
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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
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
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(resource.type);
        return matchesSearchQuery && matchesCategory && matchesType;
      });

      setResources(filteredResources);
    });

    return () => unsubscribe();
  }, [searchQuery, selectedCategories, categories, selectedTypes]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prevSelected =>
      prevSelected.includes(category)
        ? prevSelected.filter(c => c !== category)
        : [...prevSelected, category]
    );
  };

  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(prev => !prev);
    if (isTypeDropdownOpen) setIsTypeDropdownOpen(false);
  };

  const toggleTypeDropdown = () => {
    setIsTypeDropdownOpen(prev => !prev);
    if (isCategoryDropdownOpen) setIsCategoryDropdownOpen(false);
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prevSelected =>
      prevSelected.includes(type)
        ? prevSelected.filter(t => t !== type)
        : [...prevSelected, type]
    );
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSearchQuery("");
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
            <Dropdown isOpen={isCategoryDropdownOpen}>
              <DropdownTrigger>
                <Button onClick={toggleCategoryDropdown} className="bg-orange hover:bg-orange/90 text-light">
                  Filter by Category
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                {categories.map((category) => (
                  <DropdownItem key={category.id} className="category-chip">
                    <Checkbox
                      isSelected={selectedCategories.includes(category.category)}
                      onChange={() => handleCategoryChange(category.category)}
                      className="mb-1 mr-1 text-light"
                    >
                      {category.category}
                    </Checkbox>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown isOpen={isTypeDropdownOpen}>
              <DropdownTrigger>
                <Button onClick={toggleTypeDropdown} className="bg-orange hover:bg-orange/90 text-light">
                  Filter by Type
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                {["resource", "document", "youtube"].map((type) => (
                  <DropdownItem key={type} className="type-chip">
                    <Checkbox
                      isSelected={selectedTypes.includes(type)}
                      onChange={() => handleTypeChange(type)}
                      className="mb-1 mr-1 text-light"
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Checkbox>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button onClick={handleClearAll} className="bg-red-500 hover:bg-red-600 text-light">
    Clear All
  </Button>
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
                    {resource.type === "document" || resource.type === "resource" ? (
                      resource.type === "document" ? (
                        resource.thumbnailUrl ? (
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Download className="w-full h-full text-gray-500" />
                        )
                      ) : (
                        resource.thumbnailUrl ? (
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-full h-full text-gray-500" />
                        )
                      )
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
                    onClick={() => {
                      if (resource.type === "resource") {
                        window.open(resource.resourceLink, "_blank");
                      } else if (resource.type === "document") {
                        window.open(resource.documentUrl, "_blank");
                      } else {
                        window.open(resource.youtubeUrl, "_blank");
                      }
                    }}
                  >
                    {resource.type === "resource" 
                      ? "Read Resource" 
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
