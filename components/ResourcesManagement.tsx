"use client";

import { useState, useEffect } from "react";
import { Button, Input } from "@nextui-org/react";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query } from "firebase/firestore";
import { toast } from "react-toastify";

interface Resource {
  id: string;
  title: string;
  youtubeUrl: string;
}

const ResourcesManagement = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({ title: "", youtubeUrl: "" });

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
      setNewResource({ title: "", youtubeUrl: "" });
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

  return (
    <div className="space-y-4 text-light">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="text"
          label="Title"
          value={newResource.title}
          onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
          className="text-light"
        />
        <Input
          type="text"
          label="YouTube URL"
          value={newResource.youtubeUrl}
          onChange={(e) => setNewResource({ ...newResource, youtubeUrl: e.target.value })}
          className="text-light"
        />
      </div>
      <Button onClick={handleAddResource} color="primary">Add Resource</Button>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-light">Existing Resources</h2>
        <div className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.id} className="flex items-center justify-between bg-darker p-4 rounded-lg">
              <div>
                <h3 className="text-lg font-medium text-light">{resource.title}</h3>
                <p className="text-sm text-gray">{resource.youtubeUrl}</p>
              </div>
              <Button onClick={() => handleDeleteResource(resource.id)} color="danger" size="sm">Delete</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcesManagement;
