"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";


// User type
type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "engineer" | "user" | "sub";
  active?: boolean;
};
// Dynamically import the top left menu
const Topleftmenu = dynamic(() => import('@/components/top-left-menu'));

export default function AdminManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("user");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        setUsers(data.users || []);
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
        setUsers((prev) => [...prev, data.user]);
        setName("");
        setEmail("");
        setPassword("");
        setRole("user");
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
              className="border px-2 py-1 rounded flex-1 min-w-0"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="border px-2 py-1 rounded flex-1 min-w-0"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <select
              className="border px-2 py-1 rounded flex-1 min-w-0"
              value={role}
              onChange={(e) => setRole(e.target.value as User["role"])}
            >
              <option value="user">User</option>
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
                  <tr key={u._id} className="border-t hover:bg-gray-50">
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
                      {u.role !== "user" && (
                        <Button size="sm" onClick={() => changeRole(u._id, "user")}>
                          Make User
                        </Button>
                      )}
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