"use client";

import { db } from "@/lib/firebase";
import { Button, Input, Select, SelectItem } from "@nextui-org/react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Resource {
  id: string;
  title: string;
  youtubeUrl: string;
  category: string;
}

interface Category {
  id: string;
  category: string;
}

const ResourcesManagement = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    title: "",
    youtubeUrl: "",
    category: "",
  });

  useEffect(() => {
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];
      setResources(resourcesData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddResource = async () => {
    try {
      await addDoc(collection(db, "resources"), newResource);
      setNewResource({ title: "", youtubeUrl: "", category: "" });
      toast.success("Resource added successfully");
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource");
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteDoc(doc(db, "resources", resourceId));
      toast.success("Resource deleted successfully");
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const handleAddCategory = async () => {
    try {
      await addDoc(collection(db, "categories"), {
        category: newCategory,
      });

      toast.success("Category added successfully");
      setNewCategory("");
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Function to handle checkbox change
  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(category)
        ? prevSelected.filter((c) => c !== category)
        : [...prevSelected, category]
    );
  };

  const [categories, setCategories] = useState<Category[]>([]);

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

  // const handleSearchResourcesByTitle = async (searchQuery: string) => {
  //   const resourcesQuery = query(collection(db, "resources"));
  //   const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
  //     const resourcesData = snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     })) as Resource[];

  //     // Search resources that contain the search query in the title
  //     const searchedResources = resourcesData.filter((resource) =>
  //       resource.title.toLowerCase().includes(searchQuery.toLowerCase())
  //     );

  //     setResources(searchedResources);
  //   });

  //   return () => unsubscribe();
  // };

  const handleFilterResourcesByCategory = () => {
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];

      // Filter resources that match the selected categories
      const filteredResources = resourcesData.filter((resource) =>
        selectedCategories.includes(resource.category)
      );

      setResources(filteredResources);
    });

    return () => unsubscribe();
  };

  const handleClearFilter = () => {
    setSelectedCategories([]); // Clear selected categories

    // Fetch all resources again
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];
      setResources(resourcesData);
    });

    return () => unsubscribe();
  };

  // const [searchQuery, setSearchQuery] = useState("");

  const handleSearchAndFilterResources = () => {
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];

      // Filter resources based on partial match of newResource.title and selected categories
      const filteredResources = resourcesData.filter((resource) => {
        const matchesSearchQuery = resource.title
          .toLowerCase()
          .includes(newResource.title.toLowerCase());
        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(resource.category);
        return matchesSearchQuery && matchesCategory;
      });

      setResources(filteredResources);
    });

    return () => unsubscribe();
  };
  const [isDeleteDropdownOpen, setIsDeleteDropdownOpen] = useState(false);
  const [categoriesToDelete, setCategoriesToDelete] = useState<string[]>([]);

  const handleCategoryDeleteChange = (categoryId: string) => {
    setCategoriesToDelete((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const handleDeleteSelectedCategories = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete the selected categories?"
    );
    if (!confirmDelete) return;

    try {
      const deletePromises = categoriesToDelete.map((categoryId) =>
        deleteDoc(doc(db, "categories", categoryId))
      );
      await Promise.all(deletePromises);
      toast.success("Selected categories deleted successfully");
      setCategoriesToDelete([]); // Clear selected categories after deletion
    } catch (error) {
      console.error("Error deleting categories:", error);
      toast.error("Failed to delete selected categories");
    }
  };

  return (
    <div className="space-y-4 text-light">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="text"
          label="Title"
          value={newResource.title}
          onChange={(e) =>
            setNewResource({ ...newResource, title: e.target.value })
          }
          className="text-light"
        />
        <Input
          type="text"
          label="YouTube URL"
          value={newResource.youtubeUrl}
          onChange={(e) =>
            setNewResource({ ...newResource, youtubeUrl: e.target.value })
          }
          className="text-light"
        />
        <Select
          label="Category"
          value={newResource.category}
          onChange={(e) =>
            setNewResource({ ...newResource, category: e.target.value })
          }
          className="text-light"
        >
          <SelectItem key="Select a category" value="">
            Select a category
          </SelectItem>
          {/* Wrap the mapped items in a fragment */}
          <>
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.category}
                className="select-item-text"
              >
                {category.category}
              </SelectItem>
            ))}
          </>
        </Select>
      </div>
      <div className="space-y-2 md:space-x-4">
        <Button onClick={handleAddResource} color="primary">
          Add Resource
        </Button>
        <Button onClick={handleSearchAndFilterResources} color="primary">
          Search Resources
        </Button>
        <Button
          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          color="primary"
        >
          Filter Resources
        </Button>
      </div>

      {isFilterDropdownOpen && (
        <div className="dropdown-content">
          <h3>Filter by Categories</h3>
          {/* Wrap the mapped elements in a fragment */}
          <>
            {categories.map((category) => (
              <div key={category.id}>
                <input
                  type="checkbox"
                  id={category.id}
                  value={category.category}
                  checked={selectedCategories.includes(category.category)}
                  onChange={() => handleCategoryChange(category.category)}
                />
                <label htmlFor={category.id}>{category.category}</label>
              </div>
            ))}
          </>
          <div className="space-y-2 md:space-x-4">
            <Button onClick={handleFilterResourcesByCategory} color="primary">
              Apply Filter
            </Button>
            <Button onClick={handleClearFilter} color="secondary">
              Clear
            </Button>
          </div>
        </div>
      )}
      <hr className="my-4" />
      <div className=" space-y-2 md:space-x-4">
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          color="primary"
        >
          Add Category
        </Button>
        {isDropdownOpen && (
          <div className="mt-2">
            <Input
              type="text"
              label="New Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="text-light mb-2"
            />
            <Button onClick={handleAddCategory} color="primary">
              Submit
            </Button>
          </div>
        )}
        <Button
          onClick={() => setIsDeleteDropdownOpen(!isDeleteDropdownOpen)}
          color="primary"
        >
          Delete Categories
        </Button>
      </div>
      {isDeleteDropdownOpen && (
        <div className="dropdown-content">
          <h3>Select Categories to Delete</h3>
          {categories.map((category) => (
            <div key={category.id}>
              <input
                type="checkbox"
                id={`delete-${category.id}`}
                value={category.category}
                checked={categoriesToDelete.includes(category.id)}
                onChange={() => handleCategoryDeleteChange(category.id)}
              />
              <label htmlFor={`delete-${category.id}`}>
                {category.category}
              </label>
            </div>
          ))}
          <Button onClick={handleDeleteSelectedCategories} color="danger">
            Delete Selected
          </Button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-light">
          Existing Resources
        </h2>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center justify-between bg-darker p-4 rounded-lg"
            >
              <div>
                <h3 className="text-lg font-medium text-light">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray">{resource.youtubeUrl}</p>
              </div>
              <Button
                onClick={() => handleDeleteResource(resource.id)}
                color="danger"
                size="sm"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesManagement;
