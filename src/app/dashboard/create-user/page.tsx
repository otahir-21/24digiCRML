"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserType } from "@/types/auth"
import { adminService } from "@/lib/api-client"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ApiError } from "@/types/api"

const createUserSchema = z.object({
  loginId: z.string().min(1, "Email or mobile is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.enum(["male", "female", "other"]),
  userType: z.enum([
    UserType.ADMIN,
    UserType.STAFF_MANAGER,
    UserType.STAFF_EDITOR,
    UserType.STAFF_VIEWER,
  ]),
  permissions: z.array(z.string()).optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>

const roleOptions = [
  { value: UserType.ADMIN, label: "Admin", description: "Full system access" },
  { value: UserType.STAFF_MANAGER, label: "Staff Manager", description: "User management, reports" },
  { value: UserType.STAFF_EDITOR, label: "Staff Editor", description: "Content management, orders" },
  { value: UserType.STAFF_VIEWER, label: "Staff Viewer", description: "Read-only access" },
]

const permissionOptions = [
  { value: "users.read", label: "View Users" },
  { value: "users.write", label: "Manage Users" },
  { value: "orders.read", label: "View Orders" },
  { value: "orders.write", label: "Manage Orders" },
  { value: "challenges.read", label: "View Challenges" },
  { value: "challenges.write", label: "Manage Challenges" },
  { value: "reports.read", label: "View Reports" },
  { value: "settings.write", label: "Manage Settings" },
]

export default function CreateUserPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      loginId: "",
      firstName: "",
      lastName: "",
      gender: "male",
      userType: UserType.STAFF_VIEWER,
      permissions: [],
    },
  })

  const isEmail = (value: string) => {
    return value.includes("@")
  }

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsLoading(true)
      setError("")
      setSuccess("")

      const params = {
        ...(isEmail(data.loginId)
          ? { email: data.loginId }
          : { mobile: data.loginId }),
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        userType: data.userType,
        permissions: data.permissions,
      }

      const response = await adminService.createAdminUser(params)
      
      if (response.status === "success") {
        setSuccess(`${data.userType.replace('_', ' ')} user created successfully!`)
        form.reset()
        setTimeout(() => {
          router.push("/dashboard/users")
        }, 2000)
      }
    } catch (err) {
      const error = err as ApiError
      setError(error.response?.data?.message || "Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={[UserType.ADMIN]}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Admin/Staff User</CardTitle>
            <CardDescription>
              Create a new admin or staff user with specific roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="loginId">Email or Mobile</Label>
                <Input
                  id="loginId"
                  placeholder="admin@example.com or +1234567890"
                  {...form.register("loginId")}
                  disabled={isLoading}
                />
                {form.formState.errors.loginId && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.loginId.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    {...form.register("firstName")}
                    disabled={isLoading}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    {...form.register("lastName")}
                    disabled={isLoading}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={form.watch("gender")}
                    onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other")}
                    disabled={isLoading}
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
                  {form.formState.errors.gender && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>User Role</Label>
                <div className="space-y-2">
                  {roleOptions.map((role) => (
                    <label
                      key={role.value}
                      className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        value={role.value}
                        {...form.register("userType")}
                        className="mt-1"
                        disabled={isLoading}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{role.label}</p>
                        <p className="text-sm text-gray-500">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {form.formState.errors.userType && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.userType.message}
                  </p>
                )}
              </div>

              {form.watch("userType") !== UserType.ADMIN && (
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <p className="text-sm text-gray-500">
                    Select specific permissions for this staff member
                  </p>
                  <div className="space-y-2">
                    {permissionOptions.map((permission) => (
                      <label
                        key={permission.value}
                        className="flex items-center space-x-3 p-2"
                      >
                        <input
                          type="checkbox"
                          value={permission.value}
                          {...form.register("permissions")}
                          disabled={isLoading}
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}