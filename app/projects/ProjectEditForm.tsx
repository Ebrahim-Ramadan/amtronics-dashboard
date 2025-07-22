"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Edit, XIcon, Plus } from "lucide-react";

interface ProductRef {
  id: string;
}

interface Engineer {
  name: string;
  bundle: ProductRef[];
}

interface Project {
  _id: string;
  name: string;
  engineers: Engineer[];
}

const ENGINEER_OPTIONS = [
  { value: "Ahmed", label: "Ahmed" },
  { value: "Mohamed", label: "Mohamed" },
  { value: "Zeyad", label: "Zeyad" },
];

interface ProjectEditModalProps {
  project: Project;
}

export function ProjectEditModal({ project }: ProjectEditModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(project.name);
  const [engineers, setEngineers] = useState<Engineer[]>(project.engineers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEngineerNameChange = (index: number, newName: string) => {
    const updated = [...engineers];
    updated[index].name = newName;
    setEngineers(updated);
  };

  const handleProductIdChange = (
    engIndex: number,
    prodIndex: number,
    value: string
  ) => {
    const updated = [...engineers];
    updated[engIndex].bundle[prodIndex] = {
      id: value,
    };
    setEngineers(updated);
  };

  const addProductToEngineer = (engIndex: number) => {
    const updated = [...engineers];
    updated[engIndex].bundle.push({ id: "" });
    setEngineers(updated);
  };

  const removeProductFromEngineer = (engIndex: number, prodIndex: number) => {
    const updated = [...engineers];
    updated[engIndex].bundle.splice(prodIndex, 1);
    setEngineers(updated);
  };

const addEngineer = () => {
  const hasEmptyProductId = engineers.some((eng) =>
    eng.bundle.some((prod) => !prod.id.trim())
  );

  if (hasEmptyProductId) {
    setError("Please fill all existing product IDs before adding a new engineer.");
    return;
  }

  setEngineers([...engineers, { name: "Ahmed", bundle: [{ id: "" }] }]);
  setError(null); // Clear any previous error
};


  const removeEngineer = (index: number) => {
    const updated = [...engineers];
    updated.splice(index, 1);
    setEngineers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
if (name.trim() === "" && engineers.length === 0) {
  setError("Project name is required");
  return;
}
 // Check if any product ID is empty
  for (const eng of engineers) {
    for (const prod of eng.bundle) {
      if (!prod.id.trim()) {
        setError("All product IDs must be filled.");
        return;
      }
    }
  }
setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project._id, name, engineers }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update project");
      }

      setOpen(false);
      startTransition(() => router.refresh());
    } catch (err: any) {
      setError(err.message || "Unknown error");
      // end transition to allow UI updates
      startTransition(() => {});
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async () => {
  const confirmDelete = confirm("Are you sure you want to delete this project?");
  if (!confirmDelete) return;

  setLoading(true);
  setError(null);
  try {
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project._id }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to delete project");
    }

    setOpen(false);
    startTransition(() => router.refresh());
  } catch (err: any) {
    setError(err.message || "Unknown error during deletion");
  } finally {
    setLoading(false);
  }
};


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Edit project ${project.name}`}>
          <Edit className="h-5 w-5" />
        </Button>

      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogClose className="absolute top-3 right-3" />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500">{error}</div>}

          <div>
            <Label htmlFor="project-name" className="mb-1 block">
              Project Name
            </Label>
            <Input
              id="project-name"
              name="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {engineers.map((eng, engIdx) => (
            <div
              key={engIdx}
              className="border rounded p-4 space-y-4 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`engineer-name-${engIdx}`}
                  className="font-semibold"
                >
                  Engineer Name
                </Label>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeEngineer(engIdx)}
                  disabled={engineers.length === 1}
                >
                  Remove
                  <XIcon className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <Select
                value={eng.name}
                onValueChange={(val) => handleEngineerNameChange(engIdx, val)}
              >
                <SelectTrigger id={`engineer-name-${engIdx}`}>
                  <SelectValue placeholder="Select engineer" />
                </SelectTrigger>
                <SelectContent>
                  {ENGINEER_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2 mt-4">
                <Label className="font-semibold">Bundle Products</Label>
                {eng.bundle.map((prod, prodIdx) => (
                  <div key={prodIdx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Product ID"
                      value={prod.id}
                      onChange={(e) =>
                        handleProductIdChange(engIdx, prodIdx, e.target.value)
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProductFromEngineer(engIdx, prodIdx)}
                      disabled={eng.bundle.length === 1}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addProductToEngineer(engIdx)}
                  disabled={eng.bundle.some((item) => !item.id.trim())}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>
          ))}

          <Button type="button" onClick={addEngineer} className="w-full sm:w-auto" disabled={loading || isPending || engineers.some((eng) =>
    eng.bundle.some((prod) => !prod.id.trim())
  )}>
            <Plus className="mr-1 h-4 w-4" />
            Add Engineer
          </Button>
<div className="gap-2 mt-6 flex justify-between items-end flex-col w-full md:flex-row">
  
          <div className="flex gap-4 w-full">
            <Button
              type="submit"
              disabled={loading || isPending}
              className=""
            >
              {loading || isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              // className="w-full "
            >
              Cancel
            </Button>
           
          </div>
           <Button
  type="button"
  variant="destructive"
  onClick={handleDelete}
  // className="w-full sm:w-auto"
>
  Delete Project
</Button>
</div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
