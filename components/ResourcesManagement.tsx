"use client";

import { db } from "@/lib/firebase";
import { Button, Input, Checkbox, Modal, ModalContent, ModalHeader, ModalFooter, ModalBody, Select, SelectItem } from "@nextui-org/react";
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
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { X } from "lucide-react";
import 'react-toastify/dist/ReactToastify.css';

type Resource = {
  id: string;
  title: string;
  youtubeUrl?: string;
  resourceLink?: string;
  documentUrl?: string;
  thumbnailUrl?: string;
  categories: string[];
  type: ResourceType;
}

type Category = {
  id: string;
  category: string;
}

type ResourceType = "youtube" | "resource" | "document";

const ResourcesManagement = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    title: "",
    youtubeUrl: "",
    resourceLink: "",
    documentFile: null as File | null,
    thumbnail: null as File | null,
    categories: [] as string[],
  });
  const [resourceType, setResourceType] = useState<ResourceType>("youtube");
  const storage = getStorage();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

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

  const [categoryToDeleteFromResource, setCategoryToDeleteFromResource] = useState<{resourceId: string, categoryId: string} | null>(null);
  const [categoriesToDeleteBulk, setCategoriesToDeleteBulk] = useState<string[]>([]);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

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

  const handleClearFilter = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);

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

  const [selectedCategoriesForNewResource, setSelectedCategoriesForNewResource] = useState<string[]>([]);

  const handleCategorySelectionChange = (categoryId: string) => {
    setSelectedCategoriesForNewResource((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const handleResourceTypeChange = (type: ResourceType) => {
    setResourceType(type);
    setNewResource({
      title: "",
      youtubeUrl: "",
      resourceLink: "",
      documentFile: null,
      thumbnail: null,
      categories: [],
    });
  };

  const handleInputChange = (field: keyof typeof newResource, value: string | File | null) => {
    setNewResource(prev => ({ ...prev, [field]: value }));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleAddResource = async () => {
    if (!newResource.title || (resourceType === "youtube" && !newResource.youtubeUrl) || (resourceType === "resource" && !newResource.resourceLink) || (resourceType === "document" && !newResource.documentFile)) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      let documentUrl = "";
      let thumbnailUrl = "";

      if (newResource.documentFile) {
        documentUrl = await uploadFile(newResource.documentFile, `documents/${newResource.documentFile.name}`);
      }

      if (newResource.thumbnail) {
        thumbnailUrl = await uploadFile(newResource.thumbnail, `thumbnails/${newResource.thumbnail.name}`);
      }

      const resourceToAdd: Omit<Resource, 'id'> = {
        title: newResource.title,
        categories: selectedCategoriesForNewResource,
        type: resourceType,
        youtubeUrl: resourceType === "youtube" ? newResource.youtubeUrl : "",
        resourceLink: resourceType === "resource" ? newResource.resourceLink : "",
        documentUrl: documentUrl || "",
        thumbnailUrl: thumbnailUrl || ""
      };

      await addDoc(collection(db, "resources"), resourceToAdd);
      toast.success("Resource added successfully");
      setNewResource({
        title: "",
        youtubeUrl: "",
        resourceLink: "",
        documentFile: null,
        thumbnail: null,
        categories: [],
      });
      setSelectedCategoriesForNewResource([]);
    } catch (error) {
      console.error("Error adding resource:", error);
      toast.error("Failed to add resource");
    }
  };

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const handleTypeChange = (type: string) => {
    setSelectedTypes(prevSelected =>
      prevSelected.includes(type)
        ? prevSelected.filter(t => t !== type)
        : [...prevSelected, type]
    );
  };

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategories.length === 0 || resource.categories.some(categoryId => selectedCategories.includes(categoryId));
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(resource.type);
    return matchesCategory && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-light">
      <ToastContainer />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-darker p-6 rounded-xl border border-readonly/30">
          <h2 className="text-xl font-bold mb-4">Add New Resource</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              value={resourceType}
              onChange={(e) => handleResourceTypeChange(e.target.value as ResourceType)}
              className="bg-dark text-black p-2 rounded"
            >
              <SelectItem className="text-light" value="youtube" key={"youtube"}>YouTube</SelectItem>
              <SelectItem className="text-light" value="Resource" key={"Resource"}>Resource</SelectItem>
              <SelectItem className="text-light" value="document" key={"document"}>Document</SelectItem>
            </Select>

            <Input
              type="text"
              label="Title"
              value={newResource.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              classNames={{
                input: "bg-dark text-light",
                label: "text-gray"
              }}
            />

            {resourceType === "youtube" && (
              <Input
                type="text"
                label="YouTube URL"
                value={newResource.youtubeUrl}
                onChange={(e) => handleInputChange("youtubeUrl", e.target.value)}
                classNames={{
                  input: "bg-dark text-light",
                  label: "text-gray"
                }}
              />
            )}

            {resourceType === "resource" && (
              <>
                <Input
                  type="text"
                  label="Resource Link"
                  value={newResource.resourceLink}
                  onChange={(e) => handleInputChange("resourceLink", e.target.value)}
                  classNames={{
                    input: "bg-dark text-light",
                    label: "text-gray"
                  }}
                />
                <Input
                  type="file"
                  aria-label="Thumbnail"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    handleInputChange("thumbnail", file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setThumbnailPreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  classNames={{
                    input: "bg-dark text-light",
                    label: "text-gray"
                  }}
                />
                <p className="text-gray">Thumbnail image</p>
                {thumbnailPreview && (
                  <div className="mt-2">
                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-auto rounded" />
                  </div>
                )}
              </>
            )}

            {resourceType === "document" && (
              <>
                <Input
                  type="file"
                  aria-label="Document File"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleInputChange("documentFile", e.target.files ? e.target.files[0] : null)}
                  classNames={{
                    input: "bg-dark text-light",
                    label: "text-gray"
                  }}
                />
                <label className="text-gray">Upload PDF or Document</label>
                <Input
                  type="file"
                  aria-label="Thumbnail"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files ? e.target.files[0] : null;
                    handleInputChange("thumbnail", file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setThumbnailPreview(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  classNames={{
                    input: "bg-dark text-light",
                    label: "text-gray"
                  }}
                />
                <p className="text-gray">Thumbnail image</p>
                {thumbnailPreview && (
                  <div className="mt-2">
                    <img src={thumbnailPreview} alt="Thumbnail Preview" className="w-full h-auto rounded" />
                  </div>
                )}
              </>
            )}
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
                  className="text-light"
                >
                  {category.category}
                </Checkbox>
              ))}
            </div>

            <h3 className="font-semibold mb-2">Filter by Types</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {["resource", "document", "youtube"].map((type) => (
                <Checkbox
                  key={type}
                  isSelected={selectedTypes.includes(type)}
                  onChange={() => handleTypeChange(type)}
                  className="text-light"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Checkbox>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleClearFilter} className="bg-readonly text-gray">
                Clear
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredResources
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
                    <p className="text-gray text-sm mb-2">
                      {resource.youtubeUrl ? (
                        <a href={resource.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {resource.youtubeUrl}
                        </a>
                      ) : resource.resourceLink ? (
                        <a href={resource.resourceLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          {resource.resourceLink}
                        </a>
                      ) : (
                        resource.documentUrl ? resource.documentUrl.split('/').pop()?.split('?')[0].split('.').pop()?.toUpperCase() : ""
                      )}
                    </p>
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

          {filteredResources.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-dark rounded-xl border border-readonly/30">
              <h3 className="text-xl font-bold text-light mb-2">No Resources Added Yet</h3>
              <p className="text-gray text-center mb-4">Start by adding your first trading resource above.</p>
              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    titleInputRef.current?.focus();
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
}

export default ResourcesManagement;