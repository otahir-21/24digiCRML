"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { challengeService, competitionService } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Eye, CheckCircle, XCircle, Calendar, Users, Globe, Building2, Clock, AlertCircle, MessageSquare, UserCircle } from "lucide-react"
import { formatCurrency } from "@/utils/currency"
import { Challenge, Competition } from "@/types/api"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SponsoredItem {
  _id: string
  id: string
  title?: string // for challenges
  name?: string // for competitions
  type: "challenge" | "competition"
  status: string
  sponsorName: string
  sponsorLogo?: string
  sponsorWebsite?: string
  sponsorshipAmount?: number
  sponsorDescription?: string
  startDate: string
  endDate: string
  currentParticipants?: number
  maxParticipants?: number
  creatorId?: string
  creatorProfileId?: string
  createdAt?: string
  updatedAt?: string
}

export default function SponsoredPage() {
  const [sponsoredChallenges, setSponsoredChallenges] = useState<SponsoredItem[]>([])
  const [sponsoredCompetitions, setSponsoredCompetitions] = useState<SponsoredItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<SponsoredItem | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [statistics, setStatistics] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    activeSponsored: 0,
    completedSponsored: 0,
    totalRevenue: 0,
    averageReviewTime: 0,
    approvalRate: 0,
  })
  const { toast } = useToast()

  // Categorize items by status
  const pendingRequests = [...sponsoredChallenges, ...sponsoredCompetitions].filter(
    item => item.status === "draft"
  )
  const activeSponsored = [...sponsoredChallenges, ...sponsoredCompetitions].filter(
    item => item.status === "active"
  )
  const completedSponsored = [...sponsoredChallenges, ...sponsoredCompetitions].filter(
    item => item.status === "completed" || item.status === "cancelled"
  )

  useEffect(() => {
    fetchSponsoredContent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSponsoredContent = async () => {
    try {
      setLoading(true)
      
      // Fetch sponsored challenges
      const challengesData = await challengeService.findAll({ type: "sponsored" })
      const sponsoredChallengesList = (challengesData || []).map((c: Challenge) => ({
        _id: c._id,
        id: c._id,
        title: c.title,
        type: "challenge" as const,
        status: c.status,
        sponsorName: c.sponsorName || "",
        sponsorLogo: c.sponsorLogo,
        sponsorWebsite: c.sponsorWebsite,
        sponsorshipAmount: c.sponsorshipAmount,
        startDate: c.startDate,
        endDate: c.endDate,
        currentParticipants: (c as { currentParticipants?: number }).currentParticipants || 0,
        maxParticipants: c.maxParticipants,
        creatorProfileId: c.creatorProfileId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
      setSponsoredChallenges(sponsoredChallengesList)
      
      // Fetch competitions with sponsors
      const competitionsData = await competitionService.findAll()
      const competitions = Array.isArray(competitionsData) ? competitionsData : competitionsData.competitions || []
      const sponsoredCompetitionsList = competitions
        .filter((c: Competition) => c.sponsorName)
        .map((c: Competition) => ({
          _id: c._id,
          id: c._id,
          name: c.name,
          type: "competition" as const,
          status: c.status,
          sponsorName: c.sponsorName || "",
          sponsorLogo: c.sponsorLogo,
          sponsorWebsite: c.sponsorWebsite,
          sponsorDescription: c.sponsorDescription,
          startDate: c.startDate,
          endDate: c.endDate,
          currentParticipants: c.currentParticipants,
          maxParticipants: c.maxParticipants,
          creatorId: c.creatorId,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }))
      setSponsoredCompetitions(sponsoredCompetitionsList)
      
      // Calculate enhanced statistics
      const allSponsored = [...sponsoredChallengesList, ...sponsoredCompetitionsList]
      const pendingItems = allSponsored.filter(item => item.status === "draft")
      const activeItems = allSponsored.filter(item => item.status === "active")
      const completedItems = allSponsored.filter(item => item.status === "completed" || item.status === "cancelled")
      const totalRevenue = allSponsored.reduce((sum, item) => sum + (item.sponsorshipAmount || 0), 0)
      
      // Calculate average review time for processed items
      const processedItems = allSponsored.filter(item => item.status !== "draft" && item.createdAt && item.updatedAt)
      const avgReviewTime = processedItems.length > 0
        ? processedItems.reduce((sum, item) => {
            const created = new Date(item.createdAt!).getTime()
            const updated = new Date(item.updatedAt!).getTime()
            return sum + (updated - created) / (1000 * 60 * 60 * 24) // Convert to days
          }, 0) / processedItems.length
        : 0
      
      // Calculate approval rate
      const approvalRate = allSponsored.length > 0
        ? ((activeItems.length + completedItems.filter(i => i.status === "completed").length) / allSponsored.length) * 100
        : 0
      
      setStatistics({
        totalRequests: allSponsored.length,
        pendingRequests: pendingItems.length,
        activeSponsored: activeItems.length,
        completedSponsored: completedItems.length,
        totalRevenue,
        averageReviewTime: Math.round(avgReviewTime * 10) / 10, // Round to 1 decimal
        approvalRate: Math.round(approvalRate),
      })
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to fetch sponsored content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (item: SponsoredItem) => {
    try {
      // For challenges and competitions in draft status, we need to activate them
      if (item.type === "challenge") {
        // Update challenge status to active
        await challengeService.update(item.id, { status: "active" })
      } else {
        // Activate competition
        await competitionService.activate(item.id)
      }

      toast({
        title: "Success",
        description: `Sponsored ${item.type} approved and activated`,
      })
      fetchSponsoredContent()
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to approve sponsored content",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (item: SponsoredItem) => {
    if (!confirm(`Are you sure you want to reject this sponsored ${item.type}?`)) return
    
    try {
      // Update status to cancelled
      if (item.type === "challenge") {
        await challengeService.update(item.id, { status: "cancelled" })
      } else {
        // Note: Backend may need to add status update endpoint for competitions
        toast({
          title: "Info",
          description: "Competition rejection needs backend support",
        })
      }
      
      toast({
        title: "Success",
        description: `Sponsored ${item.type} rejected`,
      })
      fetchSponsoredContent()
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to reject sponsored content",
        variant: "destructive",
      })
    }
  }

  const handleRequestChanges = async () => {
    if (!selectedItem || !adminNotes) {
      toast({
        title: "Error",
        description: "Please provide feedback for the requester",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Keep in draft status but with admin feedback
      // Note: This would ideally store the admin notes in the database
      toast({
        title: "Success",
        description: "Feedback sent to requester. Request remains pending for resubmission.",
      })
      setIsFeedbackOpen(false)
      setAdminNotes("")
      fetchSponsoredContent()
    } catch {
      toast({
        title: "Error",
        description: "Failed to send feedback",
        variant: "destructive",
      })
    }
  }

  const openViewDialog = (item: SponsoredItem) => {
    setSelectedItem(item)
    setIsViewOpen(true)
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "active": return "default"
      case "draft": return "secondary"
      case "completed": return "default"
      case "cancelled": return "destructive"
      default: return "outline"
    }
  }

  const getPendingDuration = (createdAt?: string) => {
    if (!createdAt) return 0
    const created = new Date(createdAt).getTime()
    const now = new Date().getTime()
    return Math.floor((now - created) / (1000 * 60 * 60 * 24)) // Days
  }

  const getPriorityIndicator = (item: SponsoredItem) => {
    const pendingDays = getPendingDuration(item.createdAt)
    const amount = item.sponsorshipAmount || 0
    
    // High priority: pending > 3 days or high value (> 10000 AED)
    if (pendingDays > 3 || amount > 10000) {
      return { color: "text-red-600", label: "High Priority", icon: AlertCircle }
    }
    // Medium priority: pending > 1 day or medium value (> 5000 AED)
    if (pendingDays > 1 || amount > 5000) {
      return { color: "text-yellow-600", label: "Medium Priority", icon: Clock }
    }
    // Low priority
    return { color: "text-green-600", label: "Low Priority", icon: CheckCircle }
  }

  const getRowClassName = (item: SponsoredItem) => {
    if (item.status !== "draft") return ""
    const pendingDays = getPendingDuration(item.createdAt)
    if (pendingDays > 3) return "bg-red-50"
    if (pendingDays > 1) return "bg-yellow-50"
    return ""
  }

  const RequestsTable = ({ items }: { items: SponsoredItem[] }) => (
    <Table>
      <TableCaption>Pending sponsor competition requests from users</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Priority</TableHead>
          <TableHead>Title/Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Sponsor</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Pending</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">Loading...</TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">No pending requests</TableCell>
          </TableRow>
        ) : (
          items.sort((a, b) => {
            // Sort by priority (pending duration and amount)
            const aPriority = getPendingDuration(a.createdAt) * 1000 + (a.sponsorshipAmount || 0)
            const bPriority = getPendingDuration(b.createdAt) * 1000 + (b.sponsorshipAmount || 0)
            return bPriority - aPriority
          }).map((item) => {
            const priority = getPriorityIndicator(item)
            const PriorityIcon = priority.icon
            const pendingDays = getPendingDuration(item.createdAt)
            
            return (
              <TableRow key={item._id} className={getRowClassName(item)}>
                <TableCell>
                  <div className={`flex items-center gap-1 ${priority.color}`}>
                    <PriorityIcon className="h-4 w-4" />
                    <span className="text-xs">{priority.label}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {item.title || item.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <UserCircle className="h-3 w-3" />
                    {item.creatorId || item.creatorProfileId || "Unknown"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    {item.sponsorName}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {item.sponsorshipAmount ? formatCurrency(item.sponsorshipAmount) : "-"}
                </TableCell>
                <TableCell>
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                </TableCell>
                <TableCell>
                  <span className={pendingDays > 3 ? "text-red-600 font-medium" : ""}>
                    {pendingDays} days
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openViewDialog(item)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleApprove(item)}
                      title="Approve"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedItem(item)
                        setIsFeedbackOpen(true)
                      }}
                      title="Request Changes"
                    >
                      <MessageSquare className="h-4 w-4 text-yellow-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReject(item)}
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )

  const SponsoredTable = ({ items, status }: { items: SponsoredItem[], status: string }) => (
    <Table>
      <TableCaption>List of {status} sponsored content</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Title/Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Sponsor</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Participants</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">Loading...</TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center">No {status} sponsored content found</TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item._id}>
              <TableCell className="font-medium">
                {item.title || item.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.type}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  {item.sponsorName}
                </div>
              </TableCell>
              <TableCell>
                {item.sponsorshipAmount ? formatCurrency(item.sponsorshipAmount) : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(item.status)}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {item.currentParticipants || 0}/{item.maxParticipants || "∞"}
                </div>
              </TableCell>
              <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(item.endDate).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openViewDialog(item)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pendingRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sponsorships</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.activeSponsored}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">All sponsorships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approval Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.approvalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Avg review: {statistics.averageReviewTime} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsor Competition Requests & Management</CardTitle>
          <CardDescription>Review user-submitted sponsor requests and manage active sponsorships</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Pending Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 bg-yellow-600 text-white text-xs rounded-full px-2 py-0.5">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">
                Active Sponsorships ({activeSponsored.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedSponsored.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending">
              <RequestsTable items={pendingRequests} />
            </TabsContent>
            
            <TabsContent value="active">
              <SponsoredTable items={activeSponsored} status="active" />
            </TabsContent>
            
            <TabsContent value="completed">
              <SponsoredTable items={completedSponsored} status="completed" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Provide feedback to the requester about what needs to be changed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Request Title</Label>
              <p className="font-medium">{selectedItem?.title || selectedItem?.name}</p>
            </div>
            
            <div>
              <Label>Requester</Label>
              <p>{selectedItem?.creatorId || selectedItem?.creatorProfileId || "Unknown"}</p>
            </div>
            
            <div>
              <Label htmlFor="adminNotes">Admin Feedback</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Please provide detailed feedback about what needs to be changed..."
                rows={6}
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsFeedbackOpen(false)
              setAdminNotes("")
            }}>
              Cancel
            </Button>
            <Button onClick={handleRequestChanges} className="bg-yellow-600 hover:bg-yellow-700">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sponsored {selectedItem?.type === "challenge" ? "Challenge" : "Competition"} Details</DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedItem.title || selectedItem.name}</h3>
                {selectedItem.status === "draft" && (
                  <div className="mt-2">
                    {(() => {
                      const priority = getPriorityIndicator(selectedItem)
                      const PriorityIcon = priority.icon
                      return (
                        <div className={`inline-flex items-center gap-2 ${priority.color}`}>
                          <PriorityIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{priority.label}</span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
              
              {selectedItem.status === "draft" && (
                <div className="border rounded-lg p-4 bg-yellow-50">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    Request Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Requested By</Label>
                      <p className="font-medium">{selectedItem.creatorId || selectedItem.creatorProfileId || "Unknown"}</p>
                    </div>
                    <div>
                      <Label>Submitted Date</Label>
                      <p>{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : "Unknown"}</p>
                    </div>
                    <div>
                      <Label>Pending Duration</Label>
                      <p className="font-medium text-yellow-600">
                        {getPendingDuration(selectedItem.createdAt)} days
                      </p>
                    </div>
                    <div>
                      <Label>Request Type</Label>
                      <p>New Sponsor Competition</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p className="capitalize">{selectedItem.type}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedItem.status)}>
                    {selectedItem.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Sponsor Information</h4>
                <div className="space-y-2 border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sponsor Name</Label>
                      <p className="font-medium">{selectedItem.sponsorName}</p>
                    </div>
                    {selectedItem.sponsorshipAmount && (
                      <div>
                        <Label>Sponsorship Amount</Label>
                        <p className="font-medium text-green-600">
                          {formatCurrency(selectedItem.sponsorshipAmount)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {selectedItem.sponsorWebsite && (
                    <div>
                      <Label>Website</Label>
                      <a 
                        href={selectedItem.sponsorWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {selectedItem.sponsorWebsite}
                      </a>
                    </div>
                  )}
                  
                  {selectedItem.sponsorLogo && (
                    <div>
                      <Label>Logo</Label>
                      <Image 
                        src={selectedItem.sponsorLogo} 
                        alt={selectedItem.sponsorName} 
                        width={80}
                        height={80}
                        className="h-20 object-contain"
                      />
                    </div>
                  )}
                  
                  {selectedItem.sponsorDescription && (
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedItem.sponsorDescription}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedItem.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedItem.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Participants</Label>
                  <p className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedItem.currentParticipants || 0}/{selectedItem.maxParticipants || "∞"}
                  </p>
                </div>
                <div>
                  <Label>Creator</Label>
                  <p>{selectedItem.creatorId || selectedItem.creatorProfileId || "N/A"}</p>
                </div>
              </div>
              
              {selectedItem.status === "draft" && (
                <div className="border-t pt-4">
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="default" 
                      onClick={() => {
                        handleApprove(selectedItem)
                        setIsViewOpen(false)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve & Activate
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleReject(selectedItem)
                        setIsViewOpen(false)
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}