"use client"

import { useState, useEffect, useCallback } from "react"
import { adminService } from "@/lib/api-client"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  UserCheck,
  UserX,
  Shield,
  Users,
  Settings,
  Eye
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/types/api"
import Link from "next/link"

interface AdminUser {
  profileId: string
  userType: string
  email?: string
  mobile?: string
  firstName?: string
  lastName?: string
  gender?: string
  isActive?: boolean
  permissions?: string[]
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string
}

interface CreateAdminUserParams {
  firstName: string
  lastName: string
  gender: string
  userType: string
  permissions: string[]
  email?: string
  mobile?: string
}

interface UpdateAdminUserParams extends CreateAdminUserParams {
  isActive: boolean
}

const USER_TYPES = {
  admin: "Admin",
  staff_manager: "Staff Manager",
  staff_editor: "Staff Editor",
  staff_viewer: "Staff Viewer"
}

const PERMISSIONS = [
  "users.read",
  "users.write",
  "orders.read",
  "orders.write",
  "challenges.read",
  "challenges.write",
  "reports.read",
  "settings.write"
]

export default function AdminUsersPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [formData, setFormData] = useState({
    loginId: "",
    email: "",
    mobile: "",
    firstName: "",
    lastName: "",
    gender: "male",
    userType: "staff_viewer",
    permissions: [] as string[],
    isActive: true,
  })
  const { toast } = useToast()

  const isEmail = (value: string) => {
    return value.includes("@")
  }

  const fetchAdminUsers = useCallback(async () => {
    try {
      const response = await adminService.getAdminUsers()
      setAdminUsers(response || [])
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch admin users",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchAdminUsers()
  }, [fetchAdminUsers])

  useEffect(() => {
    let filtered = adminUsers

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm) ||
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (userTypeFilter && userTypeFilter !== "all") {
      filtered = filtered.filter(user => user.userType === userTypeFilter)
    }

    setFilteredUsers(filtered)
  }, [adminUsers, searchTerm, userTypeFilter])

  const handleCreate = async () => {
    try {
      const params: CreateAdminUserParams = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        userType: formData.userType,
        permissions: formData.permissions,
      }

      if (isEmail(formData.loginId)) {
        params.email = formData.loginId
      } else {
        params.mobile = formData.loginId
      }

      await adminService.createAdminUser(params)
      toast({
        title: "Success",
        description: "Admin user created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchAdminUsers()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to create admin user",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return

    try {
      const params: UpdateAdminUserParams = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        userType: formData.userType,
        permissions: formData.permissions,
        isActive: formData.isActive,
      }

      if (isEmail(formData.loginId)) {
        params.email = formData.loginId
      } else {
        params.mobile = formData.loginId
      }

      await adminService.updateAdminUser(selectedUser.profileId, params)
      toast({
        title: "Success",
        description: "Admin user updated successfully",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchAdminUsers()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update admin user",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      await adminService.deleteAdminUser(selectedUser.profileId)
      toast({
        title: "Success",
        description: "Admin user deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchAdminUsers()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to delete admin user",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      loginId: "",
      email: "",
      mobile: "",
      firstName: "",
      lastName: "",
      gender: "male",
      userType: "staff_viewer",
      permissions: [],
      isActive: true,
    })
    setSelectedUser(null)
  }

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user)
    setFormData({
      loginId: user.email || user.mobile || "",
      email: user.email || "",
      mobile: user.mobile || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      gender: user.gender || "male",
      userType: user.userType,
      permissions: user.permissions || [],
      isActive: user.isActive ?? true,
    })
    setIsEditDialogOpen(true)
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'staff_manager':
        return 'bg-blue-100 text-blue-800'
      case 'staff_editor':
        return 'bg-green-100 text-green-800'
      case 'staff_viewer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (user: AdminUser) => (
        <div>
          <div className="font-medium">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-sm text-muted-foreground">
            ID: {user.profileId}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (user: AdminUser) => (
        <div>
          {user.email && (
            <div className="text-sm">{user.email}</div>
          )}
          {user.mobile && (
            <div className="text-sm text-muted-foreground">{user.mobile}</div>
          )}
        </div>
      ),
    },
    {
      key: "userType",
      header: "Role",
      render: (user: AdminUser) => (
        <Badge className={getUserTypeBadgeColor(user.userType)}>
          {USER_TYPES[user.userType as keyof typeof USER_TYPES] || user.userType}
        </Badge>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (user: AdminUser) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {user.permissions?.length || 0} permissions
          </div>
          {user.permissions && user.permissions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {user.permissions.slice(0, 2).map((permission, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
              {user.permissions.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{user.permissions.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          {user.isActive ? (
            <UserCheck className="h-4 w-4 text-green-500" />
          ) : (
            <UserX className="h-4 w-4 text-red-500" />
          )}
          <span className={user.isActive ? "text-green-700" : "text-red-700"}>
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (user: AdminUser) => (
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: AdminUser) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <Link href={`/dashboard/admin-users/${user.profileId}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedUser(user)
              setIsDeleteDialogOpen(true)
            }}
            disabled={user.userType === 'admin' && adminUsers.filter(u => u.userType === 'admin').length <= 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const activeUsers = adminUsers.filter(u => u.isActive).length
  const adminCount = adminUsers.filter(u => u.userType === 'admin').length
  const staffCount = adminUsers.length - adminCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin & Staff Users</h1>
          <p className="text-muted-foreground">
            Manage admin and staff user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAdminUsers} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Admin User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or mobile"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="userType">User Type</Label>
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff_manager">Staff Manager</SelectItem>
                  <SelectItem value="staff_editor">Staff Editor</SelectItem>
                  <SelectItem value="staff_viewer">Staff Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Admin & Staff Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AdminUser>
            columns={columns}
            data={filteredUsers}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false)
            setIsEditDialogOpen(false)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Admin User" : "Create Admin User"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the user details and permissions below"
                : "Fill in the details to create a new admin or staff user"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Contact Information */}
            <div className="space-y-2">
              <Label htmlFor="loginId">Email or Mobile</Label>
              <Input
                id="loginId"
                value={formData.loginId}
                onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                placeholder="admin@example.com or +1234567890"
              />
              <p className="text-sm text-muted-foreground">
                Each user must have a unique email or mobile number
              </p>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="userType">Role</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff_manager">Staff Manager</SelectItem>
                  <SelectItem value="staff_editor">Staff Editor</SelectItem>
                  <SelectItem value="staff_viewer">Staff Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Switch
                      id={permission}
                      checked={formData.permissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <Label htmlFor={permission} className="font-normal text-sm">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">User is active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setIsEditDialogOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={isEditDialogOpen ? handleEdit : handleCreate}>
              {isEditDialogOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Admin User"
        description={`Are you sure you want to delete "${selectedUser?.firstName} ${selectedUser?.lastName}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  )
}