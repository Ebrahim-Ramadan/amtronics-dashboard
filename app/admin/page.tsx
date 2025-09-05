"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { Eye, EyeOff } from "lucide-react";

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
        setProjects(data.projects || []);
      }
    } finally {
      setUserLoading(false);
    }
  }

  // Add user
  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          engineerName: name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) => [data.user, ...prev]);
        setHighlightedUserId(data.user._id);
        setName("");
        setEmail("");
        setPassword("");
        setRole("engineer");
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
              My Projects
            </h1>
          </div>
          {userLoading && <div>Loading projects...</div>}
          <div className="overflow-x-auto overflow-y-hidden rounded shadow border bg-white">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left">Project Name</th>
                  <th className="px-2 py-2 text-left">Quantities Sold</th>
                  <th className="px-2 py-2 text-left">Engineers</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p._id} className="border-t hover:bg-gray-50">
                    <td className="px-2 py-2 break-all max-w-[120px]">{p.name}</td>
                    <td className="px-2 py-2">{p.quantities_sold ?? 0}</td>
                    <td className="px-2 py-2">
                      {p.engineers.map((e) => (
                        <div key={e.email}>{e.name} ({e.email})</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projects.length === 0 && (
              <div className="p-4 text-gray-500">No projects found for you.</div>
            )}
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
          <h2 className="text-lg font-bold mb-2">Add User</h2>
          <form
            className="flex flex-col md:flex-row gap-2 mb-4"
            onSubmit={addUser}
          >
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
            <Button type="submit" size="sm" disabled={userLoading}>
              Add User
            </Button>
          </form>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <h2 className="text-lg font-bold mb-2">Manage Users & Roles</h2>
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