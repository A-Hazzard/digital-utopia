"use client";

import { db } from "@/lib/firebase";
import { Button, Input, Select, SelectItem } from "@nextui-org/react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  arrayRemove,
  arrayUnion
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { X } from "lucide-react";
import 'react-toastify/dist/ReactToastify.css';

interface Resource {
  id: string;
  title: string;
  youtubeUrl: string;
  categories: string[];
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
    categories: [],
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
      await addDoc(collection(db, "resources"), {
        ...newResource,
        categories: selectedCategories, // Include selected categories
      });
      setNewResource({ title: "", youtubeUrl: "", categories: [] });
      setSelectedCategories([]); // Clear selected categories after adding
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
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
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

      // Filter resources that match any of the selected categories
      const filteredResources = resourcesData.filter((resource) =>
        selectedCategories.length === 0 ||
        selectedCategories.some(categoryId => resource.categories.includes(categoryId))
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

  const [searchQuery, setSearchQuery] = useState("");

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
          selectedCategories.some(categoryId => resource.categories.includes(categoryId));
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

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddCategoryDropdownOpen, setIsAddCategoryDropdownOpen] = useState<string | null>(null);
  const [newCategoriesForResource, setNewCategoriesForResource] = useState<string[]>([]);

  const handleAddResourceCategory = (resourceId: string) => {
    setIsAddCategoryDropdownOpen(prev => (prev === resourceId ? null : resourceId));
    setNewCategoriesForResource([]);
  };

  const handleNewCategoryChange = (categoryId: string) => {
    setNewCategoriesForResource(prevSelected =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter(id => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const applyNewCategories = async (resourceId: string) => {
    try {
      const resourceDoc = doc(db, "resources", resourceId);
      await updateDoc(resourceDoc, {
        categories: arrayUnion(...newCategoriesForResource)
      });
      toast.success("Categories added to resource");
      setIsAddCategoryDropdownOpen(null);
    } catch (error) {
      console.error("Error adding categories:", error);
      toast.error("Failed to add categories");
    }
  };

  return (
    <div className="space-y-4 text-light">
      {/* ToastContainer for displaying toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Ensure this matches the theme used in other pages
      />

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

        <div className="space-y-2">
          <Button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className="w-full text-left shadow-xl bg-default-200/50 dark:bg-default/60 backdrop-blur-xl backdrop-saturate-200 hover:bg-default-200/70 focus-within:!bg-default-200/50 dark:hover:bg-default/70 dark:focus-within:!bg-default/60 !cursor-text"
            style={{
              borderRadius: '0.375rem',
              padding: '0.5rem 1rem',
              height: '2.5rem',
              fontSize: '1rem',
              color: 'rgba(0, 0, 0, 0.9)', // Match Input text color
            }}
          >
            Select Categories
          </Button>
          {isCategoryDropdownOpen && (
            <div className="dropdown-content bg-gray-200 p-2 rounded shadow-md max-h-24 overflow-y-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`category-${category.id}`} className="text-black">
                    {category.category}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2 md:space-x-4">
        <Button onClick={handleAddResource} color="primary">
          Add Resource
        </Button>
      </div>




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
      <hr className="my-4" />

      <div className="space-y-2 ">
        <Input
          type="text"
          label="Search Resources"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-light"
        />
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
                  value={category.id} // Use category ID here
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-light">
          Existing Resources
        </h2>
        <div className="space-y-4 fit">
          {resources
            .filter((resource) =>
              resource.title.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((resource) => (
              <div
                key={resource.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between bg-darker p-4 rounded-lg overflow-x-scroll lg:overflow-x-visible"
              >
                <div className="flex-1 mb-2 md:mb-0">
                  <h3 className="text-lg font-medium text-light fit break-words">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-gray fit break-words">
                    {resource.youtubeUrl}
                  </p>
                  <p className="text-sm text-gray fit break-words">
                    Categories: {resource.categories.map((categoryId) => {
                      const category = categories.find(cat => cat.id === categoryId);
                      if (!category) return null;

                      return (
                        <span key={categoryId} className="flex items-center">
                          {category.category}
                          <X
                            className="mb-1 cursor-pointer text-red-500 hover:text-red-700"
                            style={{ width: '15px', height: '15px' }}
                            onClick={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              try {
                                // Update the resource document to remove the category
                                await updateDoc(doc(db, "resources", resource.id), {
                                  categories: arrayRemove(categoryId)
                                });
                                toast.success("Category removed from resource");
                              } catch (error) {
                                console.error("Error removing category:", error);
                                toast.error("Failed to remove category");
                              }
                            }}
                          />
                        </span>
                      );
                    }).filter(Boolean)}
                  </p>
                </div>
                <div className="space-y-2 space-x-1 md:space-x-4">
                  <Button
                    onClick={() => handleAddResourceCategory(resource.id)}
                    color="warning"
                    size="sm"
                    className="self-end md:self-auto"
                  >
                    Add Category
                  </Button>
                  {isAddCategoryDropdownOpen === resource.id && (
                    <div className="dropdown-content bg-gray-200 p-2 rounded shadow-md max-h-24 overflow-y-auto">
                      {categories
                        .filter(category => !resource.categories.includes(category.id))
                        .map(category => (
                          <div key={category.id} className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`new-category-${category.id}`}
                              value={category.id}
                              checked={newCategoriesForResource.includes(category.id)}
                              onChange={() => handleNewCategoryChange(category.id)}
                              className="mr-2"
                            />
                            <label htmlFor={`new-category-${category.id}`} className="text-black">
                              {category.category}
                            </label>
                          </div>
                        ))}
                      <Button onClick={() => applyNewCategories(resource.id)} color="primary">
                        Apply
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={() => handleDeleteResource(resource.id)}
                    color="danger"
                    size="sm"
                    className="self-end md:self-auto"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesManagement;
