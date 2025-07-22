"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, UserCog, UserCheck, X, Plus, XIcon } from "lucide-react";
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

const ENGINEER_OPTIONS = [
  { value: "Ahmed", label: "Ahmed", icon: User },
  { value: "Mohamed", label: "Mohamed", icon: UserCog },
  { value: "Zeyad", label: "Zeyad", icon: UserCheck },
];

interface ProductRef {
  id: string;
}

interface Engineer {
  name: string;
  bundle: ProductRef[];
}

export default function AddProjectForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    engineers: [
      { name: "Ahmed", bundle: [{ id: "" }] },
    ],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleEngineerSelect(value: string, idx: number) {
    const newEngineers = [...form.engineers];
    newEngineers[idx].name = value;
    setForm({ ...form, engineers: newEngineers });
  }

  function handleFormChange(e: any, idx?: number, bundleIdx?: number, field?: string) {
    if (typeof idx === "number" && typeof bundleIdx === "number" && field) {
      // Product bundle field
      const newEngineers = [...form.engineers];
      if (field === "id") {
        newEngineers[idx].bundle[bundleIdx][field] = e.target.value;
      }
      setForm({ ...form, engineers: newEngineers });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  }

  function addEngineer() {
    // Cycle through icons for new engineers
    const nextName = ENGINEER_OPTIONS[form.engineers.length % ENGINEER_OPTIONS.length].value;
    setForm({
      ...form,
      engineers: [
        ...form.engineers,
        { name: nextName, bundle: [{ id: "" }] },
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
    newEngineers[idx].bundle.push({ id: "" });
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
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add project");
      setOpen(false);
      setForm({ name: "", engineers: [{ name: "Ahmed", bundle: [{ id: "" }] }] });
      startTransition(() => router.refresh());
    } catch (err) {
      setError("Failed to add project");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Add Project</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
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
            const Icon = ENGINEER_OPTIONS.find(opt => opt.value === eng.name)?.icon || User;
            return (
              <div key={idx} className="border rounded p-2 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <Icon className="w-5 h-5 text-blue-500" />
                    <Label htmlFor={`engineer-name-${idx}`} className="font-semibold">Engineer</Label>
                    <Select value={eng.name} onValueChange={value => handleEngineerSelect(value, idx)}>
                      <SelectTrigger id={`engineer-name-${idx}`} className="w-full sm:max-w-56">
                        <SelectValue placeholder="Select engineer" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENGINEER_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="flex items-center gap-2">
                            <opt.icon className="w-4 h-4 mr-1 inline-block text-blue-400" />
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeEngineer(idx)} disabled={form.engineers.length === 1} className="w-full sm:w-auto mt-2 sm:mt-0">Remove <X/></Button>
                </div>
                <div>
                  <Label className="font-semibold">Bundle Products</Label>
                  {eng.bundle.map((item, bundleIdx) => (
                    <div key={bundleIdx} className="flex flex-row items-start sm:items-center gap-2 my-2 w-full">
                      <Input
                        placeholder="Paste Product ID"
                        className="w-full sm:w-64"
                        value={item.id}
                        onChange={(e) => handleFormChange(e, idx, bundleIdx, "id")}
                        required
                      />
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeBundle(idx, bundleIdx)} disabled={eng.bundle.length === 1} className="w-auto">
                        <XIcon/>
                        </Button>
                    </div>
                  ))}
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
            Add Engineer</Button>
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