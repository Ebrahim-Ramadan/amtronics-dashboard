"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Role = 'admin' | 'engineer' | 'sub'

interface UserItem {
  _id: string
  email: string
  role: Role
  engineerName?: string
  allowedEngineers?: string[]
  active: boolean
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // form state
  const [id, setId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('engineer')
  const [engineerName, setEngineerName] = useState('')
  const [allowedEngineers, setAllowedEngineers] = useState('')
  const [active, setActive] = useState(true)

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to load users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function submitUser(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id || undefined,
          email,
          password: password || undefined,
          role,
          engineerName: role !== 'admin' ? engineerName || undefined : undefined,
          allowedEngineers: role === 'sub' ? allowedEngineers.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          active,
        })
      })
      if (!res.ok) throw new Error('Save failed')
      setId(null); setEmail(''); setPassword(''); setRole('engineer'); setEngineerName(''); setAllowedEngineers(''); setActive(true)
      await fetchUsers()
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function editUser(u: UserItem) {
    setId(u._id); setEmail(u.email); setPassword(''); setRole(u.role); setEngineerName(u.engineerName || ''); setAllowedEngineers((u.allowedEngineers || []).join(', ')); setActive(u.active)
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete user?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error('Delete failed')
      await fetchUsers()
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{id ? 'Edit User' : 'Create User'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitUser} className="grid gap-3 max-w-xl">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Password {id && '(leave blank to keep)'} </Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div>
                <Label>Role</Label>
                <select className="border rounded px-2 py-1" value={role} onChange={e => setRole(e.target.value as Role)}>
                  <option value="engineer">Engineer</option>
                  <option value="sub">Sub</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {(role === 'engineer') && (
                <div>
                  <Label>Engineer Name</Label>
                  <Input value={engineerName} onChange={e => setEngineerName(e.target.value)} />
                </div>
              )}
              {(role === 'sub') && (
                <div>
                  <Label>Allowed Engineers (comma separated)</Label>
                  <Input value={allowedEngineers} onChange={e => setAllowedEngineers(e.target.value)} />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input id="active" type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{id ? 'Update' : 'Create'}</Button>
                {id && <Button type="button" variant="outline" onClick={() => { setId(null); setEmail(''); setPassword(''); setRole('engineer'); setEngineerName(''); setAllowedEngineers(''); setActive(true) }}>Reset</Button>}
              </div>
              {error && <div className="text-red-500">{error}</div>}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? 'Loading...' : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">Email</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Engineer</th>
                      <th className="p-2">Allowed Engineers</th>
                      <th className="p-2">Active</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-t">
                        <td className="p-2">{u.email}</td>
                        <td className="p-2">{u.role}</td>
                        <td className="p-2">{u.engineerName || '-'}</td>
                        <td className="p-2">{(u.allowedEngineers || []).join(', ')}</td>
                        <td className="p-2">{u.active ? 'Yes' : 'No'}</td>
                        <td className="p-2 flex gap-2">
                          <Button size="sm" onClick={() => editUser(u)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteUser(u._id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
