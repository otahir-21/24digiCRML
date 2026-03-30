"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { customerService } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Mail, Phone, Shield } from "lucide-react"
import { format } from "date-fns"

interface CustomerDetail {
  auth: {
    _id: string
    email?: string
    mobile?: string
    userType: string
    isOtpVerified: boolean
    isVerified: boolean
    createdAt: string
    updatedAt: string
  }
  profile?: {
    profileId: string
    firstName?: string
    lastName?: string
    gender?: string
    nationality?: string
    dob?: string
    height?: number
    weight?: number
    totalActivePoints: number
    profilePicture?: string
    lastActive?: string
    accountSettings?: {
      isDeleted?: boolean
      isBanned?: boolean
      deletedAt?: string
    }
  }
  recentOrders: Array<{
    orderId: string
    orderDate: string
    orderTotal: number
    orderStatus: string
    deliveryStatus: string
    paymentStatus: string
  }>
  recentPoints: Array<{
    pointsId: string
    points: number
    type: string
    description: string
    expiryDate?: string
    isExpired: boolean
    createdAt: string
  }>
  statistics: {
    totalOrders: number
    totalSpent: number
    totalPoints: number
  }
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCustomerDetails(params.id as string)
    }
  }, [params.id])

  const fetchCustomerDetails = async (id: string) => {
    try {
      setLoading(true)
      const response = await customerService.getById(id)
      setCustomer(response)
    } catch (error) {
      console.error("Error fetching customer details:", error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to fetch customer details")
    } finally {
      setLoading(false)
    }
  }

  const handleBanCustomer = async () => {
    if (!confirm("Are you sure you want to ban this customer?")) return
    
    try {
      await customerService.update(params.id as string, {
        accountSettings: { isBanned: true }
      })
      toast.success("Customer banned successfully")
      fetchCustomerDetails(params.id as string)
    } catch (error) {
      console.error("Error banning customer:", error)
      toast.error("Failed to ban customer")
    }
  }

  const handleUnbanCustomer = async () => {
    try {
      await customerService.update(params.id as string, {
        accountSettings: { isBanned: false }
      })
      toast.success("Customer unbanned successfully")
      fetchCustomerDetails(params.id as string)
    } catch (error) {
      console.error("Error unbanning customer:", error)
      toast.error("Failed to unban customer")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading customer details...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Customer not found</div>
      </div>
    )
  }

  const fullName = `${customer.profile?.firstName || ''} ${customer.profile?.lastName || ''}`.trim() || 'N/A'
  const accountStatus = customer.profile?.accountSettings?.isDeleted ? 'deleted' :
                       customer.profile?.accountSettings?.isBanned ? 'banned' :
                       customer.auth.isOtpVerified ? 'active' : 'inactive'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <Badge className={`
            ${accountStatus === 'active' ? 'bg-green-100 text-green-800' : ''}
            ${accountStatus === 'inactive' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${accountStatus === 'banned' ? 'bg-red-100 text-red-800' : ''}
            ${accountStatus === 'deleted' ? 'bg-gray-100 text-gray-800' : ''}
            border-0
          `}>
            {accountStatus}
          </Badge>
        </div>
        <div className="flex gap-2">
          {customer.profile?.accountSettings?.isBanned ? (
            <Button onClick={handleUnbanCustomer} variant="outline">
              Unban Customer
            </Button>
          ) : (
            <Button onClick={handleBanCustomer} variant="outline" className="text-red-600 hover:bg-red-50">
              Ban Customer
            </Button>
          )}
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.auth.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{customer.auth.email}</span>
              </div>
            )}
            {customer.auth.mobile && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{customer.auth.mobile}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm capitalize">{customer.auth.userType.replace('_', ' ')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.profile?.gender && (
              <div className="text-sm">
                <span className="text-gray-500">Gender:</span> {customer.profile.gender}
              </div>
            )}
            {customer.profile?.nationality && (
              <div className="text-sm">
                <span className="text-gray-500">Nationality:</span> {customer.profile.nationality}
              </div>
            )}
            {customer.profile?.dob && (
              <div className="text-sm">
                <span className="text-gray-500">Date of Birth:</span> {format(new Date(customer.profile.dob), 'MMM dd, yyyy')}
              </div>
            )}
            {(customer.profile?.height || customer.profile?.weight) && (
              <div className="text-sm">
                <span className="text-gray-500">Height/Weight:</span> {customer.profile.height || '-'}cm / {customer.profile.weight || '-'}kg
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Points</span>
              <span className="font-medium">{customer.profile?.totalActivePoints || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Orders</span>
              <span className="font-medium">{customer.statistics.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Spent</span>
              <span className="font-medium">AED {customer.statistics.totalSpent.toFixed(2)}</span>
            </div>
            {customer.profile?.lastActive && (
              <div className="text-sm">
                <span className="text-gray-500">Last Active:</span> {format(new Date(customer.profile.lastActive), 'MMM dd, yyyy HH:mm')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Orders and Points */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
              <TabsTrigger value="points">Points History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="mt-4">
              {customer.recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {customer.recentOrders.map((order) => (
                    <div key={order.orderId} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">Order #{order.orderId}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(order.orderDate), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">AED {order.orderTotal.toFixed(2)}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {order.orderStatus}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {order.deliveryStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No recent orders</div>
              )}
            </TabsContent>
            
            <TabsContent value="points" className="mt-4">
              {customer.recentPoints.length > 0 ? (
                <div className="space-y-2">
                  {customer.recentPoints.map((point) => (
                    <div key={point.pointsId} className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{point.description}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(point.createdAt), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${point.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {point.points > 0 ? '+' : ''}{point.points} points
                        </div>
                        {point.isExpired && (
                          <Badge variant="outline" className="text-xs text-red-600">
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No points history</div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}