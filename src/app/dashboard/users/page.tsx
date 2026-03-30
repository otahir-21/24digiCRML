"use client"

import { useState, useEffect } from "react"
import { customerService, CustomerFilters } from "@/lib/api-client"
import { DataTable, Column } from "@/components/ui/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Download, Eye, RefreshCw, Search, UserCheck, UserX, Users } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface Customer {
  _id: string
  profileId: string
  email: string
  mobile: string
  fullName: string
  userType: string
  gender?: string
  nationality?: string
  totalActivePoints: number
  accountStatus: string
  totalOrders: number
  totalSpent: number
  createdAt: string
  lastActive?: string
}

interface CustomerStatistics {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  newCustomersToday: number
  newCustomersThisMonth: number
}

export default function UsersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [statistics, setStatistics] = useState<CustomerStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")

  useEffect(() => {
    fetchCustomers()
    fetchStatistics()
  }, [])

  const fetchCustomers = async (filters?: CustomerFilters) => {
    try {
      setLoading(true)
      const response = await customerService.getAll(filters)
      setCustomers(response.customers || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to fetch customers")
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await customerService.getStatistics()
      setStatistics(response)
    } catch (error) {
      console.error("Error fetching statistics:", error)
      toast.error("Failed to fetch statistics")
    }
  }

  const handleSearch = () => {
    const filters: CustomerFilters = {}
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== "all") filters.status = statusFilter
    if (userTypeFilter !== "all") filters.userType = userTypeFilter
    fetchCustomers(filters)
  }

  const handleExportCSV = async () => {
    try {
      const filters: CustomerFilters = {}
      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== "all") filters.status = statusFilter
      if (userTypeFilter !== "all") filters.userType = userTypeFilter
      
      const blob = await customerService.exportToCSV(filters)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("Customers exported successfully")
    } catch (error) {
      console.error("Error exporting customers:", error)
      toast.error("Failed to export customers")
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return
    
    try {
      await customerService.delete(id)
      toast.success("Customer deleted successfully")
      fetchCustomers()
    } catch (error) {
      console.error("Error deleting customer:", error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || "Failed to delete customer")
    }
  }

  const columns: Column<Customer>[] = [
    {
      key: "fullName",
      header: "Customer",
      render: (row: Customer) => (
        <div>
          <div className="font-medium">{row.fullName || 'N/A'}</div>
          <div className="text-sm text-gray-500">{row.email || row.mobile}</div>
        </div>
      )
    },
    {
      key: "userType",
      header: "Type",
      render: (row: Customer) => (
        <Badge variant="outline" className="capitalize">
          {row.userType?.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: "accountStatus",
      header: "Status",
      render: (row: Customer) => {
        const statusColors: Record<string, string> = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-yellow-100 text-yellow-800",
          banned: "bg-red-100 text-red-800",
          deleted: "bg-gray-100 text-gray-800"
        }
        return (
          <Badge className={`${statusColors[row.accountStatus] || ''} border-0`}>
            {row.accountStatus}
          </Badge>
        )
      }
    },
    {
      key: "totalActivePoints",
      header: "Points",
      render: (row: Customer) => (
        <div className="font-medium">{row.totalActivePoints || 0}</div>
      )
    },
    {
      key: "totalOrders",
      header: "Orders",
      render: (row: Customer) => (
        <div>
          <div>{row.totalOrders || 0} orders</div>
          <div className="text-sm text-gray-500">AED {row.totalSpent?.toFixed(2) || '0.00'}</div>
        </div>
      )
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (row: Customer) => (
        <div className="text-sm">
          {row.createdAt ? format(new Date(row.createdAt), 'MMM dd, yyyy') : 'N/A'}
        </div>
      )
    },
    {
      key: "_id",
      header: "Actions",
      render: (row: Customer) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/users/${row.profileId || row._id}`}>
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            size="sm" 
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={() => handleDeleteCustomer(row.profileId || row._id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{statistics.totalCustomers}</span>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">{statistics.activeCustomers}</span>
                <UserCheck className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-yellow-600">{statistics.inactiveCustomers}</span>
                <UserX className="w-5 h-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">New Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{statistics.newCustomersToday}</span>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">New This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{statistics.newCustomersThisMonth}</span>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Customers</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => fetchCustomers()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Customers Table */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading customers...</div>
            </div>
          ) : (
            <DataTable<Customer>
              columns={columns}
              data={customers}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}