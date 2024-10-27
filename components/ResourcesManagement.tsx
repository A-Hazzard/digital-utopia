"use client";

import { db } from "@/lib/firebase";
import { Button, Input, Checkbox } from "@nextui-org/react";
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

type Resource = {
  id: string;
  title: string;
  youtubeUrl: string;
  categories: string[];
}

type Category = {
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


  const handleFilterResourcesByCategory = () => {
    const resourcesQuery = query(collection(db, "resources"));
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
      const resourcesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Resource[];


      const filteredResources = resourcesData.filter((resource) =>
        selectedCategories.length === 0 ||
        selectedCategories.some(categoryId => resource.categories.includes(categoryId))
      );

      setResources(filteredResources);
    });

    return () => unsubscribe();
  };

  const handleClearFilter = () => {
    setSelectedCategories([]);


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
    try {
      const deletePromises = categoriesToDelete.map((categoryId) =>
        deleteDoc(doc(db, "categories", categoryId))
      );
      await Promise.all(deletePromises);
      toast.success("Selected categories deleted successfully");
      setCategoriesToDelete([]);
    } catch (error) {
      console.error("Error deleting categories:", error);
      toast.error("Failed to delete selected categories");
    }
  };

 
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

  const [selectedCategoriesForNewResource, setSelectedCategoriesForNewResource] = useState<string[]>([]);

  const handleCategorySelectionChange = (categoryId: string) => {
    setSelectedCategoriesForNewResource((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const handleAddResource = async () => {
    try {
      const resourceToAdd = {
        ...newResource,
        categories: selectedCategoriesForNewResource,
      };
      await addDoc(collection(db, "resources"), resourceToAdd);
      toast.success("Resource added successfully");
      setNewResource({
        title: "",
        youtubeUrl: "",
        categories: [],
      });
      setSelectedCategoriesForNewResource([]); // Reset selected categories
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource");
    }
  };

  return (
    <div className="space-y-4 text-light">
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
        theme="colored"
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

      <div className="space-y-2 ">
        <p className="font-semibold">Categories</p>
          <div className="pb-4 flex gap-2 overflow-x-scroll overflow-y-hidden whitespace-nowrap">
            {categories.map((category) => (
              <Checkbox
                key={category.id}
                isSelected={selectedCategoriesForNewResource.includes(category.id)}
                onChange={() => handleCategorySelectionChange(category.id)}
                className="inline-block"
              >
                {category.category}
              </Checkbox>
            ))}
          </div>
      </div>

      </div>


      <div className="space-y-2 md:space-x-4">
        <Button
          onClick={handleAddResource}
          color="primary"
        >
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
          <>
            {categories.map((category) => (
              <Checkbox
                key={category.id}
                isSelected={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryChange(category.id)}
                className="inline-block mr-2" 
              >
                {category.category}
              </Checkbox>
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
                  <div className="flex items-center">
                    {resource.categories.map((categoryId) => {
                      const category = categories.find(cat => cat.id === categoryId);
                      if (!category) return null;

                      return (
                        <div
                          key={categoryId}
                          className="relative flex items-center text-xs py-1 px-2 rounded-md bg-gray-700 text-white mr-2"
                        >
                          {category.category}
                          <X
                            className="ml-1 cursor-pointer text-red-500 hover:text-red-700"
                            style={{ width: '15px', height: '15px' }}
                            onClick={async (e: React.MouseEvent) => {
                              e.stopPropagation();
                              try {
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
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                </div>
                <div className="space-y-2 md:space-x-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleAddResourceCategory(resource.id)}
                      color="warning"
                      size="sm"
                      className="self-end md:self-auto"
                    >
                      Add Category
                    </Button>
                    {newCategoriesForResource.length > 0 && (
                      <Button
                        onClick={() => applyNewCategories(resource.id)}
                        color="primary"
                        size="sm"
                        className="self-end md:self-auto"
                      >
                        Apply
                      </Button>
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
                  {isAddCategoryDropdownOpen === resource.id && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categories
                        .filter(category => !resource.categories.includes(category.id))
                        .map(category => (
                          <div
                            key={category.id}
                            className={`relative flex items-center text-xs py-1 px-2 rounded-md cursor-pointer transition-colors ${
                              newCategoriesForResource.includes(category.id)
                                ? "bg-white text-black"
                                : "bg-gray-700 text-white hover:bg-gray-600"
                            }`}
                            onClick={() => handleNewCategoryChange(category.id)}
                          >
                            {category.category}
                            
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      <div className="space-y-2 md:space-x-4">
        <Button
          onClick={handleAddResource}
          color="primary"
        >
          Add Resource
        </Button>
      </div>

    </div>
  );
};

export default ResourcesManagement;
