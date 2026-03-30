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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { challengeService } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Challenge, ChallengeStatistics, Participant, ApiError } from "@/types/api"
import { Pencil, Trash2, Plus, Eye } from "lucide-react"
import { formatCurrency } from "@/utils/currency"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuthStore } from "@/stores/auth-store"

// Using imported Challenge type from @/types/api
// Additional properties specific to this component that may not be in the base Challenge type
interface ExtendedChallenge extends Omit<Challenge, 'status'> {
  challengeId: string
  currentParticipants: number
  viewCount: number
  likeCount: number
  status: "draft" | "active" | "paused" | "completed" | "cancelled"
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<ExtendedChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<ExtendedChallenge | null>(null)
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    difficulty: "",
  })
  const [statistics, setStatistics] = useState<ChallengeStatistics | null>(null)
  const { toast } = useToast()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subtitle: "",
    type: "inhouse" as "inhouse" | "sponsored" | "private",
    category: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced" | "expert",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxParticipants: 0,
    tags: [] as string[],
    coverImage: "",
    rules: {
      title: "",
      description: "",
      requirements: [] as string[],
      restrictions: [] as string[],
      allowTeamParticipation: false,
      maxTeamSize: 1,
      requireVerification: false,
    },
    rewards: {
      title: "",
      description: "",
      prizes: [] as string[],
      prizeAmount: 0,
      currency: "AED",
      badges: [] as string[],
      certificates: [] as string[],
    },
    sponsorName: "",
    sponsorLogo: "",
    sponsorWebsite: "",
    sponsorshipAmount: 0,
    requireApproval: false,
  })

  useEffect(() => {
    fetchChallenges()
    fetchStatistics()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchChallenges = async () => {
    try {
      setLoading(true)
      const data = await challengeService.findAll(filters)
      setChallenges(data)
    } catch (error) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch challenges",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const data = await challengeService.getStatistics()
      setStatistics(data)
    } catch (error) {
      console.error("Failed to fetch statistics:", error)
    }
  }

  const handleCreate = async () => {
    try {
      const dataToSend = {
        ...formData,
        creatorProfileId: user?.profileId || "",
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
      }
      await challengeService.create(dataToSend)
      toast({
        title: "Success",
        description: "Challenge created successfully",
      })
      setIsCreateOpen(false)
      fetchChallenges()
      resetForm()
    } catch (error) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to create challenge",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedChallenge) return
    
    try {
      const dataToSend = {
        ...formData,
        challengeId: selectedChallenge.challengeId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
      }
      await challengeService.update(selectedChallenge.challengeId, dataToSend)
      toast({
        title: "Success",
        description: "Challenge updated successfully",
      })
      setIsEditOpen(false)
      fetchChallenges()
      resetForm()
    } catch (error) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update challenge",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (challenge: ExtendedChallenge) => {
    if (!confirm(`Are you sure you want to delete "${challenge.title}"?`)) return
    
    try {
      await challengeService.remove(challenge.challengeId, user?.profileId || "")
      toast({
        title: "Success",
        description: "Challenge deleted successfully",
      })
      fetchChallenges()
    } catch (error) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to delete challenge",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subtitle: "",
      type: "inhouse",
      category: "",
      difficulty: "beginner",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      maxParticipants: 0,
      tags: [],
      coverImage: "",
      rules: {
        title: "",
        description: "",
        requirements: [],
        restrictions: [],
        allowTeamParticipation: false,
        maxTeamSize: 1,
        requireVerification: false,
      },
      rewards: {
        title: "",
        description: "",
        prizes: [],
        prizeAmount: 0,
        currency: "AED",
        badges: [],
        certificates: [],
      },
      sponsorName: "",
      sponsorLogo: "",
      sponsorWebsite: "",
      sponsorshipAmount: 0,
      requireApproval: false,
    })
    setSelectedChallenge(null)
  }

  const openEditDialog = (challenge: ExtendedChallenge) => {
    setSelectedChallenge(challenge)
    setFormData({
      title: challenge.title,
      description: challenge.description,
      subtitle: challenge.subtitle || "",
      type: challenge.type,
      category: challenge.category,
      difficulty: challenge.difficulty,
      startDate: new Date(challenge.startDate).toISOString().split('T')[0],
      endDate: new Date(challenge.endDate).toISOString().split('T')[0],
      registrationDeadline: challenge.registrationDeadline ? new Date(challenge.registrationDeadline).toISOString().split('T')[0] : "",
      maxParticipants: challenge.maxParticipants || 0,
      tags: challenge.tags || [],
      coverImage: challenge.coverImage || "",
      rules: {
        title: challenge.rules?.title || "",
        description: challenge.rules?.description || "",
        requirements: challenge.rules?.requirements || [],
        restrictions: challenge.rules?.restrictions || [],
        allowTeamParticipation: challenge.rules?.allowTeamParticipation || false,
        maxTeamSize: challenge.rules?.maxTeamSize || 1,
        requireVerification: challenge.rules?.requireVerification || false,
      },
      rewards: {
        title: challenge.rewards?.title || "",
        description: challenge.rewards?.description || "",
        prizes: challenge.rewards?.prizes || [],
        prizeAmount: challenge.rewards?.prizeAmount || 0,
        currency: challenge.rewards?.currency || "AED",
        badges: challenge.rewards?.badges || [],
        certificates: challenge.rewards?.certificates || [],
      },
      sponsorName: challenge.sponsorName || "",
      sponsorLogo: challenge.sponsorLogo || "",
      sponsorWebsite: challenge.sponsorWebsite || "",
      sponsorshipAmount: challenge.sponsorshipAmount || 0,
      requireApproval: challenge.requireApproval || false,
    })
    setIsEditOpen(true)
  }

  const openViewDialog = (challenge: ExtendedChallenge) => {
    setSelectedChallenge(challenge)
    setIsViewOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "draft": return "secondary"
      case "completed": return "outline"
      case "cancelled": return "destructive"
      case "paused": return "secondary"
      default: return "outline"
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "sponsored": return "default"
      case "private": return "secondary"
      case "inhouse": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalChallenges || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Challenges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.activeChallenges || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Participants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalParticipants || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Sponsored Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Challenges Management</CardTitle>
              <CardDescription>Manage all challenges and their participants</CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Challenge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Types</SelectItem>
                <SelectItem value="inhouse">In-house</SelectItem>
                <SelectItem value="sponsored">Sponsored</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.difficulty} onValueChange={(value) => setFilters({ ...filters, difficulty: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Difficulties</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableCaption>A list of all challenges in the system</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
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
              ) : challenges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">No challenges found</TableCell>
                </TableRow>
              ) : (
                challenges.map((challenge) => (
                  <TableRow key={challenge._id}>
                    <TableCell className="font-medium">
                      <div>
                        {challenge.title}
                        {challenge.isFeatured && (
                          <Badge variant="secondary" className="ml-2">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(challenge.type)}>
                        {challenge.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{challenge.category}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{challenge.difficulty}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(challenge.status)}>
                        {challenge.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {challenge.currentParticipants}/{challenge.maxParticipants || "∞"}
                    </TableCell>
                    <TableCell>{new Date(challenge.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(challenge.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(challenge)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(challenge)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(challenge)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Challenge" : "Create New Challenge"}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? "Update the challenge details" : "Fill in the details to create a new challenge"}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="sponsor">Sponsor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: "inhouse" | "sponsored" | "private") => setFormData({ ...formData, type: value })}>                    
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inhouse">In-house</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value: "beginner" | "intermediate" | "advanced" | "expert") => setFormData({ ...formData, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">Max Participants (0 = unlimited)</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireApproval"
                  checked={formData.requireApproval}
                  onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked as boolean })}
                />
                <Label htmlFor="requireApproval">Require approval to join</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="rules" className="space-y-4">
              <div>
                <Label htmlFor="rulesTitle">Rules Title</Label>
                <Input
                  id="rulesTitle"
                  value={formData.rules.title}
                  onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, title: e.target.value } })}
                />
              </div>
              
              <div>
                <Label htmlFor="rulesDescription">Rules Description</Label>
                <Textarea
                  id="rulesDescription"
                  value={formData.rules.description}
                  onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, description: e.target.value } })}
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowTeamParticipation"
                  checked={formData.rules.allowTeamParticipation}
                  onCheckedChange={(checked) => setFormData({ ...formData, rules: { ...formData.rules, allowTeamParticipation: checked as boolean } })}
                />
                <Label htmlFor="allowTeamParticipation">Allow team participation</Label>
              </div>
              
              {formData.rules.allowTeamParticipation && (
                <div>
                  <Label htmlFor="maxTeamSize">Max Team Size</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    value={formData.rules.maxTeamSize}
                    onChange={(e) => setFormData({ ...formData, rules: { ...formData.rules, maxTeamSize: parseInt(e.target.value) } })}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireVerification"
                  checked={formData.rules.requireVerification}
                  onCheckedChange={(checked) => setFormData({ ...formData, rules: { ...formData.rules, requireVerification: checked as boolean } })}
                />
                <Label htmlFor="requireVerification">Require verification</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="rewards" className="space-y-4">
              <div>
                <Label htmlFor="rewardsTitle">Rewards Title</Label>
                <Input
                  id="rewardsTitle"
                  value={formData.rewards.title}
                  onChange={(e) => setFormData({ ...formData, rewards: { ...formData.rewards, title: e.target.value } })}
                />
              </div>
              
              <div>
                <Label htmlFor="rewardsDescription">Rewards Description</Label>
                <Textarea
                  id="rewardsDescription"
                  value={formData.rewards.description}
                  onChange={(e) => setFormData({ ...formData, rewards: { ...formData.rewards, description: e.target.value } })}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prizeAmount">Prize Amount (AED)</Label>
                  <Input
                    id="prizeAmount"
                    type="number"
                    value={formData.rewards.prizeAmount}
                    onChange={(e) => setFormData({ ...formData, rewards: { ...formData.rewards, prizeAmount: parseFloat(e.target.value) } })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.rewards.currency}
                    disabled
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sponsor" className="space-y-4">
              {formData.type === "sponsored" && (
                <>
                  <div>
                    <Label htmlFor="sponsorName">Sponsor Name</Label>
                    <Input
                      id="sponsorName"
                      value={formData.sponsorName}
                      onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sponsorLogo">Sponsor Logo URL</Label>
                    <Input
                      id="sponsorLogo"
                      value={formData.sponsorLogo}
                      onChange={(e) => setFormData({ ...formData, sponsorLogo: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sponsorWebsite">Sponsor Website</Label>
                    <Input
                      id="sponsorWebsite"
                      value={formData.sponsorWebsite}
                      onChange={(e) => setFormData({ ...formData, sponsorWebsite: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sponsorshipAmount">Sponsorship Amount (AED)</Label>
                    <Input
                      id="sponsorshipAmount"
                      type="number"
                      value={formData.sponsorshipAmount}
                      onChange={(e) => setFormData({ ...formData, sponsorshipAmount: parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              )}
              {formData.type !== "sponsored" && (
                <div className="text-center text-muted-foreground py-8">
                  Sponsor information is only available for sponsored challenges
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreateOpen(false)
              setIsEditOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={isEditOpen ? handleUpdate : handleCreate}>
              {isEditOpen ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Challenge Details</DialogTitle>
          </DialogHeader>
          
          {selectedChallenge && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedChallenge.title}</h3>
                {selectedChallenge.subtitle && (
                  <p className="text-muted-foreground">{selectedChallenge.subtitle}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <div>
                    <Badge variant={getTypeBadgeVariant(selectedChallenge.type)}>
                      {selectedChallenge.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>
                    <Badge variant={getStatusBadgeVariant(selectedChallenge.status)}>
                      {selectedChallenge.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <p>{selectedChallenge.category}</p>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <p>{selectedChallenge.difficulty}</p>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <p className="whitespace-pre-wrap">{selectedChallenge.description}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p>{new Date(selectedChallenge.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p>{new Date(selectedChallenge.endDate).toLocaleDateString()}</p>
                </div>
                {selectedChallenge.registrationDeadline && (
                  <div>
                    <Label>Registration Deadline</Label>
                    <p>{new Date(selectedChallenge.registrationDeadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Participants</Label>
                  <p>{selectedChallenge.currentParticipants}/{selectedChallenge.maxParticipants || "∞"}</p>
                </div>
                <div>
                  <Label>Views / Likes</Label>
                  <p>{selectedChallenge.viewCount} / {selectedChallenge.likeCount}</p>
                </div>
              </div>
              
              {selectedChallenge.rules && (
                <div>
                  <h4 className="font-semibold">Rules</h4>
                  <p className="font-medium">{selectedChallenge.rules.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.rules.description}</p>
                  {selectedChallenge.rules.allowTeamParticipation && (
                    <p className="text-sm">Max team size: {selectedChallenge.rules.maxTeamSize}</p>
                  )}
                </div>
              )}
              
              {selectedChallenge.rewards && (
                <div>
                  <h4 className="font-semibold">Rewards</h4>
                  <p className="font-medium">{selectedChallenge.rewards.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedChallenge.rewards.description}</p>
                  {selectedChallenge.rewards.prizeAmount && selectedChallenge.rewards.prizeAmount > 0 && (
                    <p className="text-sm font-medium">Prize: {formatCurrency(selectedChallenge.rewards.prizeAmount)}</p>
                  )}
                </div>
              )}
              
              {selectedChallenge.type === "sponsored" && selectedChallenge.sponsorName && (
                <div>
                  <h4 className="font-semibold">Sponsor Information</h4>
                  <div className="space-y-2">
                    <p>Name: {selectedChallenge.sponsorName}</p>
                    {selectedChallenge.sponsorWebsite && (
                      <p>Website: <a href={selectedChallenge.sponsorWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{selectedChallenge.sponsorWebsite}</a></p>
                    )}
                    {selectedChallenge.sponsorshipAmount && selectedChallenge.sponsorshipAmount > 0 && (
                      <p>Sponsorship Amount: {formatCurrency(selectedChallenge.sponsorshipAmount)}</p>
                    )}
                  </div>
                </div>
              )}
              
              {selectedChallenge.participants && selectedChallenge.participants.length > 0 && (
                <div>
                  <h4 className="font-semibold">Participants ({selectedChallenge.participants.length})</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profile ID</TableHead>
                          <TableHead>Joined At</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedChallenge.participants.map((participant: Participant, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{participant.profileId}</TableCell>
                            <TableCell>{new Date(participant.joinedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={participant.status === "approved" ? "default" : "secondary"}>
                                {participant.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{participant.score || 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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