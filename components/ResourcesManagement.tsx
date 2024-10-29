"use client";

import { db } from "@/lib/firebase";
import { Button, Input, Checkbox, Modal, ModalContent, ModalHeader, ModalFooter, ModalBody } from "@nextui-org/react";
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
import { useEffect, useRef, useState } from "react";
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

// Add these state variables
const [categoryToDeleteFromResource, setCategoryToDeleteFromResource] = useState<{resourceId: string, categoryId: string} | null>(null);
const [categoriesToDeleteBulk, setCategoriesToDeleteBulk] = useState<string[]>([]);
const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

// Add these handlers
const handleCategoryDeleteClick = (resourceId: string, categoryId: string) => {
  setCategoryToDeleteFromResource({ resourceId, categoryId });
  setIsCategoryDeleteModalOpen(true);
};

const handleBulkDeleteClick = () => {
  setCategoriesToDeleteBulk(categoriesToDelete);
  setIsBulkDeleteModalOpen(true);
};

const confirmCategoryDelete = async () => {
  if (categoryToDeleteFromResource) {
    try {
      await updateDoc(doc(db, "resources", categoryToDeleteFromResource.resourceId), {
        categories: arrayRemove(categoryToDeleteFromResource.categoryId)
      });
      toast.success("Category removed from resource");
    } catch (error) {
      console.error("Error removing category:", error);
      toast.error("Failed to remove category");
    }
    setIsCategoryDeleteModalOpen(false);
    setCategoryToDeleteFromResource(null);
  }
};

const confirmBulkDelete = async () => {
  try {
    const deletePromises = categoriesToDeleteBulk.map((categoryId) =>
      deleteDoc(doc(db, "categories", categoryId))
    );
    await Promise.all(deletePromises);
    toast.success("Selected categories deleted successfully");
    setCategoriesToDelete([]);
  } catch (error) {
    console.error("Error deleting categories:", error);
    toast.error("Failed to delete selected categories");
  }
  setIsBulkDeleteModalOpen(false);
  setCategoriesToDeleteBulk([]);
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
  const handleDeleteClick = (resourceId: string) => {
    setResourceToDelete(resourceId);
    setIsDeleteModalOpen(true);
    console.log(isDeleteModalOpen, resourceToDelete)
  };
  
  const confirmDeleteResource = async () => {
    if (resourceToDelete) {
      try {
        await deleteDoc(doc(db, "resources", resourceToDelete));
        toast.success("Resource deleted successfully");
        setResourceToDelete(null);
      } catch (error) {
        console.error("Error deleting resource:", error);
        toast.error("Failed to delete resource");
      }
      setIsDeleteModalOpen(false);
    }
  };
  
  const [isDeleteDropdownOpen, setIsDeleteDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  const [categoriesToDelete, setCategoriesToDelete] = useState<string[]>([]);

  const handleCategoryDeleteChange = (categoryId: string) => {
    setCategoriesToDelete((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
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
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const [selectedCategoriesForNewResource, setSelectedCategoriesForNewResource] = useState<string[]>([]);

  const handleCategorySelectionChange = (categoryId: string) => {
    setSelectedCategoriesForNewResource((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const handleAddResource = async () => {
    if (!newResource.title || !newResource.youtubeUrl) {
      toast.error("Please fill in both Title and YouTube URL.");
      return;
    }
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
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
    <ToastContainer />
  
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Add Resource Form */}
      <div className="lg:col-span-2 bg-darker p-6 rounded-xl border border-readonly/30">
        <h2 className="text-xl font-bold mb-4">Add New Resource</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
  type="text"
  label="Title"
  ref={titleInputRef}
  value={newResource.title}
  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
  classNames={{
    input: `bg-dark text-light transition-all duration-300 ${isHighlighted ? 'ring-2 ring-orange' : ''}`,
    label: "text-gray"
  }}
/>
          <Input
            type="text"
            label="YouTube URL"
            value={newResource.youtubeUrl}
            onChange={(e) => setNewResource({ ...newResource, youtubeUrl: e.target.value })}
            classNames={{
              input: "bg-dark text-light",
              label: "text-gray"
            }}
          />
        </div>
  
        <div className="mb-4">
          <p className="font-semibold mb-2">Categories</p>
          <div className="flex flex-wrap gap-8">
            {categories.map((category) => (
              <Checkbox
                key={category.id}
                isSelected={selectedCategoriesForNewResource.includes(category.id)}
                onChange={() => handleCategorySelectionChange(category.id)}
                className="bg-readonly rounded-lg p-2"
              >
                {category.category}
              </Checkbox>
            ))}
          </div>
        </div>
  
        <Button 
          onClick={handleAddResource}
          className="w-full bg-orange hover:bg-orange/90"
        >
          Add Resource
        </Button>
      </div>
  
      {/* Category Management */}
      <div className="bg-darker p-6 rounded-xl border border-readonly/30">
        <h2 className="text-xl font-bold mb-4">Category Management</h2>
        <div className="space-y-4">
          <Button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-orange/20 text-orange"
          >
            Add Category
          </Button>
          <Button
            onClick={() => setIsDeleteDropdownOpen(!isDeleteDropdownOpen)}
            className="w-full bg-red-500/20 text-red-500"
          >
            Delete Categories
          </Button>
          
          {isDeleteDropdownOpen && (
            <div className="space-y-4 p-4 bg-dark rounded-lg">
              <h3 className="font-semibold text-light mb-2">Select Categories to Delete</h3>
              <div className="flex flex-wrap gap-8">
                {categories.map((category) => (
                  <Checkbox
                    key={category.id}
                    isSelected={categoriesToDelete.includes(category.id)}
                    onChange={() => handleCategoryDeleteChange(category.id)}
                    className="bg-readonly rounded-lg p-2"
                  >
                    {category.category}
                  </Checkbox>
                ))}
              </div>
              {categoriesToDelete.length > 0 && (
                <Button 
                onClick={handleBulkDeleteClick}
                className="w-full bg-red-500 text-white hover:bg-red-600"
              >
                Delete Selected Categories
              </Button>
              
              )}
            </div>
          )}
  
          {isDropdownOpen && (
            <div className="space-y-2">
              <Input
                type="text"
                label="New Category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
              <Button 
                onClick={handleAddCategory}
                className="w-full bg-orange hover:bg-orange/90"
              >
                Submit
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  
    {/* Resources List */}
    <div className="bg-darker p-6 rounded-xl border border-readonly/30">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Resources</h2>
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search Resources"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
            classNames={{
              input: "bg-dark text-light",
              label: "text-gray"
            }}
          />
          <Button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="bg-orange/20 text-orange"
          >
            Filter Resources
          </Button>
        </div>
      </div>
  
      {isFilterDropdownOpen && (
        <div className="mb-6 p-4 bg-dark rounded-lg border border-readonly/30">
          <h3 className="font-semibold mb-2">Filter by Categories</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((category) => (
              <Checkbox
                key={category.id}
                isSelected={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryChange(category.id)}
                className="bg-readonly rounded-lg p-2"
              >
                {category.category}
              </Checkbox>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFilterResourcesByCategory} className="bg-orange hover:bg-orange/90">
              Apply Filter
            </Button>
            <Button onClick={handleClearFilter} className="bg-readonly text-gray">
              Clear
            </Button>
          </div>
        </div>
      )}
  
      <div className="space-y-4">
        {resources
          .filter((resource) =>
            resource.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((resource) => (
            <div
              key={resource.id}
              className="bg-dark p-4 rounded-lg border border-readonly/30"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                  <p className="text-gray text-sm mb-2">{resource.youtubeUrl}</p>
                  <div className="flex flex-wrap gap-2">
                    {resource.categories.map((categoryId) => {
                      const category = categories.find(cat => cat.id === categoryId);
                      if (!category) return null;
  
                      return (
                        <div
                          key={categoryId}
                          className="bg-readonly text-gray text-xs px-2 py-1 rounded-full flex items-center gap-1"
                        >
                          {category.category}
                          <X
  className="cursor-pointer text-red-500 hover:text-red-700"
  style={{ width: '15px', height: '15px' }}
  onClick={(e) => {
    e.stopPropagation();
    handleCategoryDeleteClick(resource.id, categoryId);
  }}
/>

                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-orange/20 text-orange"
                    onClick={() => handleAddResourceCategory(resource.id)}
                  >
                    Add Category
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-500/20 text-red-500"
                    onClick={() => handleDeleteClick(resource.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              {isAddCategoryDropdownOpen === resource.id && (
                <div className="mt-4 p-4 bg-readonly rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {categories
                      .filter(category => !resource.categories.includes(category.id))
                      .map(category => (
                        <div
                          key={category.id}
                          className={`cursor-pointer px-3 py-1 rounded-full text-sm transition-colors ${
                            newCategoriesForResource.includes(category.id)
                              ? "bg-orange text-light"
                              : "bg-dark text-gray hover:text-light"
                          }`}
                          onClick={() => handleNewCategoryChange(category.id)}
                        >
                          {category.category}
                        </div>
                      ))}
                  </div>
                  {newCategoriesForResource.length > 0 && (
                    <Button
                      onClick={() => applyNewCategories(resource.id)}
                      className="bg-orange hover:bg-orange/90"
                      size="sm"
                    >
                      Apply Categories
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

{resources.length === 0 && (
  <div className="flex flex-col items-center justify-center p-12 bg-dark rounded-xl border border-readonly/30">
    <h3 className="text-xl font-bold text-light mb-2">No Resources Added Yet</h3>
    <p className="text-gray text-center mb-4">Start by adding your first trading resource above.</p>
    <Button
  onClick={() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      titleInputRef.current?.focus();
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 1500);
    }, 500);
  }}
  className="bg-orange/20 text-orange hover:bg-orange/30"
>
  Add Your First Resource
</Button>

  </div>
)}

      </div>
    </div>
  
  {/* Category Delete Modal */}
<Modal 
  isOpen={isCategoryDeleteModalOpen} 
  onClose={() => setIsCategoryDeleteModalOpen(false)}
  classNames={{
    base: "bg-darker border border-readonly/30",
    header: "border-b border-readonly/30",
    body: "text-light py-6",
    footer: "border-t border-readonly/30"
  }}
>
  <ModalContent>
    <ModalHeader>
      <h2 className="text-xl font-bold">Confirm Category Removal</h2>
    </ModalHeader>
    <ModalBody>
      <p>Are you sure you want to remove this category from the resource?</p>
    </ModalBody>
    <ModalFooter>
      <Button 
        variant="light" 
        className="bg-readonly text-gray"
        onClick={() => setIsCategoryDeleteModalOpen(false)}
      >
        Cancel
      </Button>
      <Button 
        className="bg-red-500 text-white hover:bg-red-600"
        onClick={confirmCategoryDelete}
      >
        Remove
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

{/* Bulk Category Delete Modal */}
<Modal 
  isOpen={isBulkDeleteModalOpen} 
  onClose={() => setIsBulkDeleteModalOpen(false)}
  classNames={{
    base: "bg-darker border border-readonly/30",
    header: "border-b border-readonly/30",
    body: "text-light py-6",
    footer: "border-t border-readonly/30"
  }}
>
  <ModalContent>
    <ModalHeader>
      <h2 className="text-xl font-bold">Confirm Categories Deletion</h2>
    </ModalHeader>
    <ModalBody>
      <p>Are you sure you want to delete these categories? This action cannot be undone.</p>
    </ModalBody>
    <ModalFooter>
      <Button 
        variant="light" 
        className="bg-readonly text-gray"
        onClick={() => setIsBulkDeleteModalOpen(false)}
      >
        Cancel
      </Button>
      <Button 
        className="bg-red-500 text-white hover:bg-red-600"
        onClick={confirmBulkDelete}
      >
        Delete
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

{/* Delete Resource Modal */}
<Modal
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  classNames={{
    base: "bg-darker border border-readonly/30",
    header: "border-b border-readonly/30",
    body: "text-light py-6",
    footer: "border-t border-readonly/30",
  }}
>
  <ModalContent>
    <ModalHeader>
      <h2 className="text-xl text-light font-bold">Confirm Resource Deletion</h2>
    </ModalHeader>
    <ModalBody>
      <p>Are you sure you want to delete this resource? This action cannot be undone.</p>
    </ModalBody>
    <ModalFooter>
      <Button
        variant="light"
        className="bg-readonly text-gray"
        onClick={() => setIsDeleteModalOpen(false)}
      >
        Cancel
      </Button>
      <Button
        className="bg-red-500 text-white hover:bg-red-600"
        onClick={confirmDeleteResource}
      >
        Delete
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

  </div>
  

  );
};

export default ResourcesManagement;
