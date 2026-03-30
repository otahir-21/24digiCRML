"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { adminService } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit,
  Shield,
  Mail,
  Phone,
  Calendar,
  User,
  Settings,
  Activity
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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

interface UserStatistics {
  profileId: string
  userType: string
  createdAt: string
  isActive: boolean
  permissions: number
}

const USER_TYPES = {
  admin: "Admin",
  staff_manager: "Staff Manager",
  staff_editor: "Staff Editor",
  staff_viewer: "Staff Viewer"
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  const userId = params.id as string

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await adminService.getAdminUserById(userId)
      setUser(response)
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch user details",
        variant: "destructive",
      })
      router.push('/dashboard/admin-users')
    } finally {
      setLoading(false)
    }
  }, [userId, toast, router])

  const fetchUserStatistics = useCallback(async () => {
    try {
      const response = await adminService.getAdminUserStatistics(userId)
      setStatistics(response)
    } catch (error: unknown) {
      console.error("Failed to fetch user statistics:", error)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUserDetails()
      fetchUserStatistics()
    }
  }, [userId, fetchUserDetails, fetchUserStatistics])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">User not found</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/admin-users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Users
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin-users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">
              Admin User Details • ID: {user.profileId}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Full Name</span>
              <span>{user.firstName} {user.lastName}</span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gender</span>
              <span className="capitalize">{user.gender || "Not specified"}</span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role</span>
              <Badge className={getUserTypeBadgeColor(user.userType)}>
                {USER_TYPES[user.userType as keyof typeof USER_TYPES] || user.userType}
              </Badge>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <span>{user.email || "Not provided"}</span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mobile</span>
              </div>
              <span>{user.mobile || "Not provided"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.permissions && user.permissions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  This user has {user.permissions.length} permission(s):
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {user.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Settings className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No specific permissions assigned. User inherits default role permissions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Account Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Created</span>
              </div>
              <span>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Updated</span>
              </div>
              <span>
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Never"}
              </span>
            </div>
            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Login</span>
              </div>
              <span>
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.permissions}</div>
                <div className="text-sm text-muted-foreground">Permissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {statistics.isActive ? "Active" : "Inactive"}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.floor((new Date().getTime() - new Date(statistics.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div className="text-sm text-muted-foreground">Days Old</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{statistics.userType}</div>
                <div className="text-sm text-muted-foreground">Role</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/admin-users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Users
          </Link>
        </Button>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit User
        </Button>
      </div>
    </div>
  )
}