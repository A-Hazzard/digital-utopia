"use client";

import { useState } from "react";
import { Button, Input } from "@nextui-org/react";

// Define the Resource interface
interface Resource {
  id: string;
  name: string;
}

// Fake data for prototyping
const fakeResources: Resource[] = [
  { id: '1', name: 'Trading Guide' },
  { id: '2', name: 'Market Analysis' },
  { id: '3', name: 'Risk Management Tips' },
];

const ResourcesManagement = () => {
  const [resources, setResources] = useState<Resource[]>(fakeResources);
  const [newResource, setNewResource] = useState('');

  const handleAddResource = () => {
    const id = (resources.length + 1).toString();
    setResources([...resources, { id, name: newResource }]);
    setNewResource('');
  };

  const handleDeleteResource = (resourceId: string) => {
    setResources(resources.filter(resource => resource.id !== resourceId));
  };

  return (
    <div>
     
      <ul>
        {resources.map((resource) => (
          <li
            key={resource.id}
            className="flex justify-between items-center mb-2"
          >
            <span className="text-light">{resource.name}</span>
            <Button
              color="danger"
              size="sm"
              onClick={() => handleDeleteResource(resource.id)}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Input
          type="text"
          label="New Resource"
          value={newResource}
          onChange={(e) => setNewResource(e.target.value)}
          className="mb-2"
        />
        <Button onClick={handleAddResource}>Add Resource</Button>
      </div>
    </div>
  );
};

export default ResourcesManagement;
