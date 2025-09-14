"use client";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, UserCog, UserCheck, X, Plus, XIcon, Search, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const ENGINEER_OPTIONS = [
  { value: "Ahmed", label: "Ahmed", icon: User },
  { value: "Mohamed", label: "Mohamed", icon: UserCog },
  { value: "Zeyad", label: "Zeyad", icon: UserCheck },
];

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
  email: string;
  bundle: ProductRef[];
}

export default function AddProjectForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    engineers: [
      { name: "", email: "", bundle: [{ id: "", name: "", quantity: 1 }] },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
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

  function handleEngineerSelect(value: string, idx: number) {
    const newEngineers = [...form.engineers];
    newEngineers[idx].name = value;
    setForm({ ...form, engineers: newEngineers });
  }

  function handleFormChange(e: any, idx?: number, bundleIdx?: number, field?: string) {
    if (typeof idx === "number" && typeof bundleIdx === "number" && field) {
      // Product bundle field
      const newEngineers = [...form.engineers];
      if (field === "id" || field === "name") {
        newEngineers[idx].bundle[bundleIdx][field] = e.target.value;
      } else if (field === "quantity") {
        newEngineers[idx].bundle[bundleIdx].quantity = Number(e.target.value) || 1;
      }
      setForm({ ...form, engineers: newEngineers });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

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
    const newEngineers = [...form.engineers];
    newEngineers[engineerIdx].bundle[bundleIdx].name = value;
    newEngineers[engineerIdx].bundle[bundleIdx].id = "";
    setForm({ ...form, engineers: newEngineers });

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

// In selectProduct, prevent duplicate product selection
const selectProduct = (product: Product, engineerIdx: number, bundleIdx: number) => {
  const newEngineers = [...form.engineers];
  // Check for duplicate product in the bundle
  const alreadyExists = newEngineers[engineerIdx].bundle.some(
    (item, idx) => item.id === product._id.toString() && idx !== bundleIdx
  );
  if (alreadyExists) {
    toast.error("This product is already added to the bundle.");
    setError("This product is already added to the bundle.");
    return;
  }
  const searchKey = `${engineerIdx}-${bundleIdx}`;
  newEngineers[engineerIdx].bundle[bundleIdx].id = product._id.toString();
  newEngineers[engineerIdx].bundle[bundleIdx].name = product.en_name;
  setForm({ ...form, engineers: newEngineers });
  setProductSearch(prev => ({ ...prev, [searchKey]: product.en_name }));
  setShowDropdown(prev => ({ ...prev, [searchKey]: false }));
  setError(null);
};

  function addEngineer() {
    setForm({
      ...form,
      engineers: [
        ...form.engineers,
        { name: "", email: "", bundle: [{ id: "", name: "", quantity: 1 }] },
      ],
    });
  }
  function removeEngineer(idx: number) {
    setForm({
      ...form,
      engineers: form.engineers.filter((_, i) => i !== idx),
    });
  }
function addBundle(idx: number) {
  const newEngineers = [...form.engineers];
  // Prevent adding duplicate products
  const bundleProductIds = newEngineers[idx].bundle.map(b => b.id);
  // Only add if last bundle is filled (to avoid empty duplicates)
  if (newEngineers[idx].bundle.some(item => !item.id.trim())) return;

  // You may want to show an error if needed
  // setError("Please select a product before adding another.");

  newEngineers[idx].bundle.push({ id: "", name: "", quantity: 1 });
  setForm({ ...form, engineers: newEngineers });
}
  function removeBundle(idx: number, bundleIdx: number) {
    const newEngineers = [...form.engineers];
    newEngineers[idx].bundle = newEngineers[idx].bundle.filter((_, i) => i !== bundleIdx);
    setForm({ ...form, engineers: newEngineers });
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    console.log("form", form);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add project");
      setOpen(false);
      setForm({ name: "", engineers: [{ name: "Ahmed", bundle: [{ id: "", name: "", quantity: 1 }] }] });
      startTransition(() => router.refresh());
    } catch (err) {
      setError("Failed to add project");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEngineerNameChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const newEngineers = [...form.engineers];
    newEngineers[idx].name = e.target.value;
    setForm({ ...form, engineers: newEngineers });
  }

  function handleEngineerEmailChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const newEngineers = [...form.engineers];
    newEngineers[idx].email = e.target.value;
    setForm({ ...form, engineers: newEngineers });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>+ Add Project</Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle> Add Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div>
            <Label className="mb-1" htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              className="max-w-full w-full"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />
          </div>
          {form.engineers.map((eng, idx) => {
            return (
              <div key={idx} className="border rounded p-2 mb-2">
                <div className="flex flex-col sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <Label htmlFor={`engineer-name-${idx}`} className="font-semibold">Engineer Name</Label>
                    <Input
                      id={`engineer-name-${idx}`}
                      className="w-full sm:max-w-56"
                      placeholder="Type engineer name"
                      value={eng.name}
                      onChange={e => handleEngineerNameChange(e, idx)}
                      required
                    />
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeEngineer(idx)} disabled={form.engineers.length === 1} className="w-full sm:w-auto mt-2 sm:mt-0">Remove <X/></Button>

                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <Label htmlFor={`engineer-email-${idx}`} className="font-semibold">Engineer Email</Label>
                    <Input
                      id={`engineer-email-${idx}`}
                      className="w-full sm:max-w-56"
                      placeholder="Type engineer email"
                      value={eng.email}
                      onChange={e => handleEngineerEmailChange(e, idx)}
                      required
                      type="email"
                    />
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Bundle Products</Label>
                  {eng.bundle.map((item, bundleIdx) => {
                    const searchKey = `${idx}-${bundleIdx}`;
                    return (
                      <div key={bundleIdx} className="flex flex-col gap-2 my-2 w-full relative">
                        <div className="flex flex-row items-start sm:items-center gap-2 w-full">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Search for product by name..."
                              className="w-full"
                              value={productSearch[searchKey] || item.name || ""}
                              onChange={(e) => handleProductSearch(e.target.value, idx, bundleIdx)}
                              required
                            />
                            <Search className="absolute bg-white right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            
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
                                      onClick={() => selectProduct(product, idx, bundleIdx)}
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
                            value={item.quantity ?? 1}
                            onChange={(e) => handleFormChange(e, idx, bundleIdx, "quantity")}
                            placeholder="Qty"
                          />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeBundle(idx, bundleIdx)} 
                            disabled={eng.bundle.length === 1} 
                            className="w-auto"
                          >
                            <XIcon/>
                          </Button>
                        </div>
                        
                        {/* Show selected product ID */}
                        {item.id && (
                          <div className="text-xs text-gray-600 pl-2">
                            Selected Product ID: <span className="font-mono bg-gray-100 px-1 rounded">{item.id}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addBundle(idx)}
                    className="w-full sm:w-auto mt-2"
                    disabled={eng.bundle.some((item) => !item.id.trim())}
                  >
                    <Plus/>
                    Add Product
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end mt-4">
            <Button type="button" size="sm" onClick={addEngineer} className=" w-full sm:w-auto">
              <Plus/>
              Add Engineer
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={submitting || isPending} className="w-full sm:w-auto">{submitting || isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Project"}</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">Cancel</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}