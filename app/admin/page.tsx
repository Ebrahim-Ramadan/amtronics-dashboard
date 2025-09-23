"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Check, Eye, EyeOff } from "lucide-react";
import LoadingDots from "@/components/ui/loading-dots";

// User type
type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "engineer" | "sub";
  active?: boolean;
};

type Project = {
  _id: string;
  name: string;
  quantities_sold?: number;
  engineers: { name: string; email: string }[];
  total_sales?: number;
  paymentMethod?: string[]; // Add payment_method field
};

// Dynamically import the top left menu
const Topleftmenu = dynamic(() => import('@/components/top-left-menu'));

export default function AdminManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("engineer");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // For engineer's projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [session, setSession] = useState<User | null>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedPromos, setSelectedPromos] = useState<string[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allPromos, setAllPromos] = useState<{_id: string, code: string}[]>([]);

  // Fetch session/user info
  useEffect(() => {
    async function fetchSession() {
      const res = await fetch("/api/session");
      if (res.ok) {
        const data = await res.json();
        console.log('data', data);
        setSession(data.user || null);
      }
    }
    fetchSession();
  }, []);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setUserLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        // Sort users by _id (assuming ObjectId, latest first)
        const sorted = [...(data.users || [])].sort((a, b) =>
          b._id.localeCompare(a._id)
        );
        setUsers(sorted);
      }
    } finally {
      setUserLoading(false);
    }
  }

  // Fetch projects for engineer
  useEffect(() => {
    
    if (session?.role === "engineer") {
      fetchEngineerProjects(session.email);
    }
  }, [session]);

  async function fetchEngineerProjects(email: string) {
    setUserLoading(true);
    try {
      const res = await fetch(`/api/projects?engineerEmail=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        console.log('data', data);
        
        setProjects(data.projects || []);
      }
    } finally {
      setUserLoading(false);
    }
  }
const [subDataLoaded, setSubDataLoaded] = useState(false);
const [subLoading, setSubLoading] = useState(false);

useEffect(() => {
  // Only fetch if role is sub and data not loaded yet
  if (role === "sub" && !subDataLoaded && (allProjects.length === 0 || allPromos.length === 0)) {
    setSubLoading(true);
    Promise.all([
      fetch("/api/projects?sub=true").then(res => res.json()),
      fetch("/api/promocodes?sub=true").then(res => res.json()),
    ]).then(([projectsData, promosData]) => {
      setAllProjects(projectsData.projects || []);
      setAllPromos(promosData.promocodes || []);
      setSubDataLoaded(true);
      setSubLoading(false);
    }).catch(() => setSubLoading(false));
  }
  // Do NOT reset subDataLoaded when switching away from sub
}, [role, subDataLoaded, allProjects.length, allPromos.length]);


  // Add user
  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    setError(null);
    try {
      const body: any = {
        email,
        password,
        role,
        engineerName: name,
      };
      if (role === "sub") {
        body.allowedProjects = selectedProjects;
        body.allowedPromos = selectedPromos;
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => [data.user, ...prev]);
        setHighlightedUserId(data.user._id);
        setName("");
        setEmail("");
        setPassword("");
        setRole("engineer");
        setSelectedProjects([]);
        setSelectedPromos([]);
        // Remove highlight after 2 seconds
        setTimeout(() => setHighlightedUserId(null), 2000);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to add user");
      }
    } finally {
      setUserLoading(false);
    }
  }

  // Change user role
  async function changeRole(userId: string, newRole: User["role"]) {
    setUserLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } finally {
      setUserLoading(false);
    }
  }

  // Remove user
  async function removeUser(userId: string) {
    setUserLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      }
    } finally {
      setUserLoading(false);
    }
  }

  // If engineer, show only their projects
  if (session?.role === "engineer") {
    return (
      <div className="min-h-screen bg-gray-50 p-2 md:p-6">
        <div className="w-full mx-auto space-y-6">
          <div className="flex items-center gap-2 md:gap-4 mb-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">
               Projects
            </h1>
          </div>
          {userLoading && <div>Loading projects...</div>}
          <div className="overflow-x-auto w-full">
  <table className="min-w-full text-xs md:text-sm whitespace-nowrap">
    <thead>
      <tr className="bg-gray-100">
        <th className="px-2 py-2 text-left">Project Name</th>
        <th className="px-2 py-2 text-left">Quantities Sold</th>
        <th className="px-2 py-2 text-left">Total Sales (KD)</th>
        <th className="px-2 py-2 text-left">Payment Method</th> {/* Add this column */}

        <th className="px-2 py-2 text-left">Engineers</th>
      </tr>
    </thead>
    <tbody>
      {projects.map((p) => (
        <tr key={p._id} className="border-t hover:bg-gray-50">
          <td className="px-2 py-2 max-w-[120px] truncate">{p.name}</td>
          <td className="px-2 py-2">{p.quantities_sold ?? 0}</td>
          <td className="px-2 py-2">{p.total_sales?.toFixed(2) ?? "0.00"}</td>
          <td className="px-2 py-2">
        {Array.isArray(p.paymentMethod) && p.paymentMethod.length > 0
          ? p.paymentMethod.join(", ")
          : "-"}
      </td>
          <td className="px-2 py-2">
            {p.engineers.map((e, idx) => (
              <span key={e.email}>
                {e.name} ({e.email}){idx < p.engineers.length - 1 ? ", " : ""}
              </span>
            ))}
          </td>
          
        </tr>
      ))}
    </tbody>
  </table>
</div>
        </div>
      </div>
    );
  }

  // Default: admin management
  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        <div className="flex items-center gap-2 md:gap-4 mb-4">
          <Topleftmenu />
          <h1 className="text-xl md:text-3xl font-bold text-gray-900">
            Administration
          </h1>
        </div>
        <div>
          <h2 className="text-lg font-bold mb-2">Add New User</h2>
          <form
  className="flex flex-col gap-2 mb-4"
  onSubmit={addUser}
>
  <div className="flex flex-col md:flex-row gap-2 w-full">
    <input
    className="border px-2 py-1 rounded flex-1 min-w-0"
    placeholder="Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
  />
  <input
    autoCorrect="off"
    autoComplete="off"
    className="border px-2 py-1 rounded flex-1 min-w-0"
    placeholder="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
  <div className="relative flex-1 min-w-0">
    <input
      autoComplete="off"
      autoCorrect="off"
      className="border px-2 py-1 rounded w-full pr-10"
      placeholder="Password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />
    <button
      type="button"
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
      tabIndex={-1}
      onClick={() => setShowPassword((v) => !v)}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  </div>
  <select
    className="border px-2 py-1 rounded flex-1 min-w-0"
    value={role}
    onChange={(e) => setRole(e.target.value as User["role"])}
  >
    <option value="engineer">Engineer</option>
    <option value="admin">Admin</option>
    <option value="sub">Sub</option>
  </select>
  </div>
  {/* Show project and promo selection if subadmin */}
  {role === "sub" && (
    <div className="flex flex-col gap-4 w-full mt-2">
      {subLoading ? (
        <div className="flex justify-center w-full"><LoadingDots/></div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Projects Grid */}
          <div className="flex-1">
            <label className="font-semibold text-xs mb-2 block">Select Projects for Subadmin:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {allProjects.map(p => (
                <button
                  key={p._id}
                  type="button"
                      className={`border rounded px-3 py-2 text-left flex justify-between items-center transition

                    ${selectedProjects.includes(p._id)
                      ? "bg-blue-100 border-blue-500 font-semibold"
                      : "bg-white hover:bg-gray-100"}
                  `}
                  onClick={() => setSelectedProjects(selectedProjects.includes(p._id)
                    ? selectedProjects.filter(id => id !== p._id)
                    : [...selectedProjects, p._id]
                  )}
                >
                 <span >{p.name}</span>
                  {selectedProjects.includes(p._id) && (
      <Check className="ml-2 text-blue-600 w-4 h-4" />
    )}
                </button>
              ))}
            </div>
          </div>
          {/* Promo Codes Grid */}
          <div className="flex-1">
            <label className="font-semibold text-xs mb-2 block">Select Promo Codes for Subadmin:</label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
           
           
           {allPromos.map(p => (
  <button
    key={p._id}
    type="button"
    className={`
      relative border rounded-lg px-4 py-3 text-left flex flex-col justify-between items-start 
      transition-all duration-200 ease-in-out shadow-sm
      ${selectedPromos.includes(p._id)
        ? "bg-green-50 border-green-600 text-green-900 font-semibold shadow-md"
        : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:shadow-md"}
      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
    `}
    onClick={() => setSelectedPromos(selectedPromos.includes(p._id)
      ? selectedPromos.filter(id => id !== p._id)
      : [...selectedPromos, p._id]
    )}
  >
    <div className={`text-sm ${selectedPromos.includes(p._id) ? "font-bold" : "font-medium"}`}>{p.code}</div>
    <div className="text-xs text-gray-500 mt-1">
      {p.percentage ? `${p.percentage}% off` : "No discount"}
    </div>
     {selectedPromos.includes(p._id) && (
      <Check className="absolute bottom-2 right-2 ml-2 text-green-600 w-4 h-4" />
    )}
   
  </button>
))}
            </div>
          </div>
        </div>
      )}
      <span className="text-xs text-gray-500 mt-2">
        Click to select/deselect. Selected items are highlighted.
      </span>
    </div>
  )}
  <Button type="submit" size="sm" disabled={userLoading}>
    Add User
  </Button>
</form>
           {/* Info for admin about password */}
        <div className="mb-4">
          <div className="text-xs bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 px-4 py-2 rounded font-semibold">
            You will <span className="text-blue-700 font-bold">not be able to view or copy the password later</span>. Please copy it before submitting.
          </div>
        </div>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <h2 className="text-lg mt-8  font-bold mb-2">Manage Users & Roles</h2>
          {userLoading && <div>Loading users...</div>}
          <div className="overflow-x-auto overflow-y-hidden rounded shadow border bg-white">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left">Name</th>
                  <th className="px-2 py-2 text-left">Email</th>
                  <th className="px-2 py-2 text-left">Role</th>
                  <th className="px-2 py-2 text-left">Active</th>
                  <th className="px-2 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className={`border-t hover:bg-gray-50 transition-colors ${
                      highlightedUserId === u._id ? "bg-yellow-200" : ""
                    }`}
                  >
                    <td className="px-2 py-2 break-all max-w-[120px]">{u.name}</td>
                    <td className="px-2 py-2 break-all max-w-[180px]">{u.email}</td>
                    <td className="px-2 py-2 capitalize">{u.role}</td>
                    <td className="px-2 py-2">{u.active ? "Yes" : "No"}</td>
                    <td className="px-2 py-2 flex flex-wrap gap-1">
                      {u.role !== "admin" && (
                        <Button size="sm" onClick={() => changeRole(u._id, "admin")}>
                          Make Admin
                        </Button>
                      )}
                      {u.role !== "engineer" && (
                        <Button size="sm" onClick={() => changeRole(u._id, "engineer")}>
                          Make Engineer
                        </Button>
                      )}
                      {/* {u.role !== "user" && (
                        <Button size="sm" onClick={() => changeRole(u._id, "user")}>
                          Make User
                        </Button>
                      )} */}
                      <Button size="sm" variant="destructive" onClick={() => removeUser(u._id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}