"use client";

import { useState, useTransition, useEffect } from "react";
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
import { Edit, XIcon, Plus, Search, Loader2 } from "lucide-react";

interface ProductRef {
  id: string;
  name?: string;
  quantity?: number; // <-- Add quantity field
}

interface Product {
  _id: string;
  id: number;
  en_name: string;
  ar_name: string;
  sku: string;
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
  const [engineers, setEngineers] = useState<Engineer[]>(
    project.engineers.map(eng => ({
      ...eng,
      bundle: eng.bundle.map(prod => ({
        ...prod,
        quantity: prod.quantity ?? 1, // Default to 1 if not present
      })),
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Product search states
  const [productSearch, setProductSearch] = useState<{ [key: string]: string }>({});
  const [searchResults, setSearchResults] = useState<{ [key: string]: Product[] }>({});
  const [searchLoading, setSearchLoading] = useState<{ [key: string]: boolean }>({});
  const [showDropdown, setShowDropdown] = useState<{ [key: string]: boolean }>({});
  const [searchTimeouts, setSearchTimeouts] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown({});
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      name: updated[engIndex].bundle[prodIndex].name,
    };
    setEngineers(updated);
  };

  // Add quantity input handler
  const handleProductQuantityChange = (
    engIndex: number,
    prodIndex: number,
    value: string
  ) => {
    const updated = [...engineers];
    updated[engIndex].bundle[prodIndex].quantity = Number(value) || 1;
    setEngineers(updated);
  };

  // Product search functions
  const searchProducts = async (query: string, engineerIdx: number, bundleIdx: number) => {
    const searchKey = `${engineerIdx}-${bundleIdx}`;
    
    if (!query.trim()) {
      setSearchResults(prev => ({ ...prev, [searchKey]: [] }));
      setShowDropdown(prev => ({ ...prev, [searchKey]: false }));
      return;
    }

    setSearchLoading(prev => ({ ...prev, [searchKey]: true }));
    
    try {
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10&projectbundleproducts=true`);
      if (response.ok) {
        const data = await response.json();
        console.log('fetched products:', data);
        
        setSearchResults(prev => ({ ...prev, [searchKey]: data.products || [] }));
        setShowDropdown(prev => ({ ...prev, [searchKey]: true }));
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults(prev => ({ ...prev, [searchKey]: [] }));
    } finally {
      setSearchLoading(prev => ({ ...prev, [searchKey]: false }));
    }
  };

  const handleProductSearch = (value: string, engineerIdx: number, bundleIdx: number) => {
    const searchKey = `${engineerIdx}-${bundleIdx}`;
    setProductSearch(prev => ({ ...prev, [searchKey]: value }));
    
    // Clear the selected product when typing
    const updated = [...engineers];
    updated[engineerIdx].bundle[bundleIdx].name = value;
    updated[engineerIdx].bundle[bundleIdx].id = "";
    setEngineers(updated);

    // Clear existing timeout
    if (searchTimeouts[searchKey]) {
      clearTimeout(searchTimeouts[searchKey]);
    }

    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      searchProducts(value, engineerIdx, bundleIdx);
    }, 500); // 500ms delay

    setSearchTimeouts(prev => ({ ...prev, [searchKey]: timeoutId }));
  };

  const selectProduct = (product: Product, engineerIdx: number, bundleIdx: number) => {
    const searchKey = `${engineerIdx}-${bundleIdx}`;
    const updated = [...engineers];
    
    updated[engineIdx].bundle[bundleIdx].id = product._id.toString();
    updated[engineIdx].bundle[bundleIdx].name = product.en_name;
    
    setEngineers(updated);
    setProductSearch(prev => ({ ...prev, [searchKey]: product.en_name }));
    setShowDropdown(prev => ({ ...prev, [searchKey]: false }));
  };

  const addProductToEngineer = (engIndex: number) => {
    const updated = [...engineers];
    updated[engIndex].bundle.push({ id: "", name: "" });
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

  setEngineers([...engineers, { name: "Ahmed", bundle: [{ id: "", name: "" }] }]);
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
          <Edit className="h-5 w-5" /> Edit
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
                {eng.bundle.map((prod, prodIdx) => {
                  const searchKey = `${engIdx}-${prodIdx}`;
                  return (
                    <div key={prodIdx} className="flex flex-col gap-2 w-full relative">
                      <div className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <Input
                            placeholder="Search for product by name..."
                            value={productSearch[searchKey] || prod.name || ""}
                            onChange={(e) => handleProductSearch(e.target.value, engIdx, prodIdx)}
                            required
                          />
                          <Search className="bg-white absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          
                          {/* Search Results Dropdown */}
                          {showDropdown[searchKey] && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {searchLoading[searchKey] ? (
                                <div className="p-3 text-center">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                  <span className="text-sm text-gray-500">Searching...</span>
                                </div>
                              ) : searchResults[searchKey]?.length > 0 ? (
                                searchResults[searchKey].map((product) => (
                                  <div
                                    key={product.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    onClick={() => selectProduct(product, engIdx, prodIdx)}
                                  >
                                    <div className="font-medium text-sm">{product.en_name}</div>
                                    <div className="text-xs text-gray-500">
                                      ID: {product.id} • SKU: {product.sku}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-center text-sm text-gray-500">
                                  No products found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* Quantity input */}
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={prod.quantity ?? 1}
                          onChange={e => handleProductQuantityChange(engIdx, prodIdx, e.target.value)}
                          placeholder="Qty"
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
                      
                      {/* Show selected product ID */}
                      {prod.id && (
                        <div className="text-xs text-gray-600 pl-2">
                          Selected Product ID: <span className="font-mono bg-gray-100 px-1 rounded">{prod.id}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
