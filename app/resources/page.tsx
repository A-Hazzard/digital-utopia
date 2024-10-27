"use client";

import Layout from "@/app/common/Layout";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { Spinner, Input, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Card, Button } from "@nextui-org/react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import gsap from "gsap";

type Resource = {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string;
  categories: string[];
}

type Category = {
  id: string;
  category: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const router = useRouter();
  const titleRef = useRef(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  useEffect(() => {
    if (!loading) {
      gsap.from(titleRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.5,
        ease: "power3.out"
      });

      gsap.from(cardsRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out"
      });
    }
  }, [loading]);

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

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          <Spinner size="lg" />
        </div>
    );
  }

  return (
    <Layout>
      <div className="p-8 text-light">
        <h1 ref={titleRef} className="text-4xl font-bold mb-8 text-center">
          Trading Resources
        </h1>

        <div className="flex mb-4 space-x-4">
          <Input
            type="text"
            placeholder="Search by title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-light"
          />
          <Dropdown isOpen={isDropdownOpen}>
            <DropdownTrigger>
              <Button onClick={toggleDropdown}>Filter by Category</Button>
            </DropdownTrigger>
            <DropdownMenu>
              {categories.map((category) => (
                <DropdownItem key={category.id}>
                  <input
                    type="checkbox"
                    id={category.id}
                    value={category.category}
                    checked={selectedCategories.includes(category.category)}
                    onChange={() => handleCategoryChange(category.category)}
                    className="mb-1 mr-1"
                  />
                  <label htmlFor={category.id} style={{ color: 'white' }}>
                    {category.category}
                  </label>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <div
              key={resource.id}
              ref={(el) => {
                if (el) {
                  cardsRef.current[index] = el;
                }
              }}
            >
              <Card className="bg-darker hover:bg-dark transition-colors duration-300">
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-4">{resource.title}</h3>
                  <div className="aspect-w-16 aspect-h-9 mb-4">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYoutubeVideoId(resource.youtubeUrl)}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                    ></iframe>
                  </div>
                  <p className="text-gray-300 mb-4">{resource.description}</p>
                  <Button 
                    color="primary" 
                    onClick={() => window.open(resource.youtubeUrl, "_blank")}
                  >
                    Watch on YouTube
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function getYoutubeVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}
