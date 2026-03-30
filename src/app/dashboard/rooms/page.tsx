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
import { roomService } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Plus, Eye, Users, Lock, Unlock, CheckCircle, XCircle, Activity as ActivityIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuthStore } from "@/stores/auth-store"
import { Room } from "@/types/api"

interface ExtendedRoom extends Omit<Room, 'joinRequests'> {
  roomId: string
  invitedProfileIds: string[]
  memberProfileIds: string[]
  status: "active" | "inactive" | "completed" | "cancelled"
  joinRequests: Array<{
    profileId: string
    requestedAt: string
    status: "pending" | "approved" | "rejected"
    processedAt?: string
    processedBy?: string
    message?: string
  }>
  activities: Activity[]
  totalActivitiesCompleted: number
  totalPointsEarned: number
  totalDuration: number
  isDeleted: boolean
}

interface Activity {
  _id: string
  type: string
  name: string
  duration?: number
  distance?: number
  calories?: number
  points?: number
  completedAt: string
}

export default function RoomsPage() {
  const [privateRooms, setPrivateRooms] = useState<ExtendedRoom[]>([])
  const [publicRooms, setPublicRooms] = useState<ExtendedRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<ExtendedRoom | null>(null)
  const [activeTab, setActiveTab] = useState("private")
  const [filters, setFilters] = useState({
    activity: "",
    status: "",
  })
  const { toast } = useToast()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    name: "",
    activity: "",
    description: "",
    joinPointsRequired: 0,
    maxMembersCount: 10,
    roomPicture: "",
    isLocked: true,
    startDate: "",
    endDate: "",
    isVisible: true,
    tags: [] as string[],
  })

  useEffect(() => {
    fetchRooms()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      
      // Fetch private rooms (isLocked: true)
      const privateData = await roomService.findAll({
        ...filters,
        isLocked: true,
        includePrivate: true,
      })
      setPrivateRooms(privateData.rooms || [])
      
      // Fetch public rooms (isLocked: false, isVisible: true)
      const publicData = await roomService.findAll({
        ...filters,
        isLocked: false,
        includePrivate: false,
      })
      setPublicRooms(publicData.rooms || [])
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to fetch rooms",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const dataToSend = {
        ...formData,
        creatorId: user?.profileId || "",
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      }
      await roomService.create(dataToSend)
      toast({
        title: "Success",
        description: "Room created successfully",
      })
      setIsCreateOpen(false)
      fetchRooms()
      resetForm()
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to create room",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedRoom) return
    
    try {
      const dataToSend = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      }
      await roomService.update(selectedRoom.roomId, dataToSend)
      toast({
        title: "Success",
        description: "Room updated successfully",
      })
      setIsEditOpen(false)
      fetchRooms()
      resetForm()
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to update room",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (room: ExtendedRoom) => {
    if (!confirm(`Are you sure you want to delete "${room.name}"?`)) return
    
    try {
      await roomService.remove(room.roomId)
      toast({
        title: "Success",
        description: "Room deleted successfully",
      })
      fetchRooms()
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || "Failed to delete room",
        variant: "destructive",
      })
    }
  }

  const handleProcessJoinRequest = async (roomId: string, requestProfileId: string, action: "approve" | "reject") => {
    try {
      await roomService.processJoinRequest(roomId, requestProfileId, action)
      toast({
        title: "Success",
        description: `Join request ${action}d successfully`,
      })
      fetchRooms()
      if (selectedRoom) {
        const updatedRoom = await roomService.findOne(roomId)
        setSelectedRoom(updatedRoom)
      }
    } catch (error) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        title: "Error",
        description: errorMessage || `Failed to ${action} join request`,
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      activity: "",
      description: "",
      joinPointsRequired: 0,
      maxMembersCount: 10,
      roomPicture: "",
      isLocked: true,
      startDate: "",
      endDate: "",
      isVisible: true,
      tags: [],
    })
    setSelectedRoom(null)
  }

  const openEditDialog = (room: ExtendedRoom) => {
    setSelectedRoom(room)
    setFormData({
      name: room.name,
      activity: room.activity,
      description: room.description || "",
      joinPointsRequired: room.joinPointsRequired ?? 0,
      maxMembersCount: room.maxMembersCount ?? 0,
      roomPicture: room.roomPicture || "",
      isLocked: room.isLocked ?? false,
      startDate: room.startDate ? new Date(room.startDate).toISOString().split('T')[0] : "",
      endDate: room.endDate ? new Date(room.endDate).toISOString().split('T')[0] : "",
      isVisible: room.isVisible ?? true,
      tags: room.tags ?? [],
    })
    setIsEditOpen(true)
  }

  const openViewDialog = async (room: ExtendedRoom) => {
    setSelectedRoom(room)
    setIsViewOpen(true)
    
    // Fetch room statistics
    try {
      const stats = await roomService.getStatistics()
      setSelectedRoom({ ...room, ...stats })
    } catch (error) {
      console.error("Failed to fetch room statistics:", error)
    }
  }

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case "active": return "default"
      case "inactive": return "secondary"
      case "completed": return "default"
      case "cancelled": return "destructive"
      default: return "outline"
    }
  }

  const RoomTable = ({ rooms, isPrivate }: { rooms: ExtendedRoom[], isPrivate: boolean }) => (
    <Table>
      <TableCaption>A list of all {isPrivate ? "private" : "public"} rooms in the system</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Creator</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Members</TableHead>
          <TableHead>Join Points</TableHead>
          {isPrivate && <TableHead>Join Requests</TableHead>}
          <TableHead>Total Points</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={isPrivate ? 9 : 8} className="text-center">Loading...</TableCell>
          </TableRow>
        ) : rooms.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isPrivate ? 9 : 8} className="text-center">No rooms found</TableCell>
          </TableRow>
        ) : (
          rooms.map((room) => (
            <TableRow key={room._id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {room.isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  {room.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <ActivityIcon className="h-3 w-3" />
                  {room.activity}
                </div>
              </TableCell>
              <TableCell>{room.creatorId}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(room.status)}>
                  {room.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {room.currentMembersCount}/{room.maxMembersCount}
                </div>
              </TableCell>
              <TableCell>
                {(room.joinPointsRequired ?? 0) > 0 ? `${room.joinPointsRequired} pts` : "Free"}
              </TableCell>
              {isPrivate && (
                <TableCell>
                  {room.joinRequests?.filter(r => r.status === "pending").length || 0}
                </TableCell>
              )}
              <TableCell>{room.totalPointsEarned || 0}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openViewDialog(room)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(room)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(room)}
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
  )

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rooms Management</CardTitle>
              <CardDescription>Manage private and public rooms</CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Room
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <Select value={filters.activity} onValueChange={(value) => setFilters({ ...filters, activity: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Activities</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="cycling">Cycling</SelectItem>
                <SelectItem value="swimming">Swimming</SelectItem>
                <SelectItem value="meditation">Meditation</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs for Private and Public Rooms */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="private">
                Private Rooms ({privateRooms.length})
              </TabsTrigger>
              <TabsTrigger value="public">
                Public Rooms ({publicRooms.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="private">
              <RoomTable rooms={privateRooms} isPrivate={true} />
            </TabsContent>
            
            <TabsContent value="public">
              <RoomTable rooms={publicRooms} isPrivate={false} />
            </TabsContent>
          </Tabs>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Room" : "Create New Room"}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? "Update the room details" : "Fill in the details to create a new room"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="activity">Activity</Label>
                <Select value={formData.activity} onValueChange={(value) => setFormData({ ...formData, activity: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="joinPointsRequired">Join Points Required</Label>
                <Input
                  id="joinPointsRequired"
                  type="number"
                  value={formData.joinPointsRequired}
                  onChange={(e) => setFormData({ ...formData, joinPointsRequired: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxMembersCount">Max Members</Label>
                <Input
                  id="maxMembersCount"
                  type="number"
                  value={formData.maxMembersCount}
                  onChange={(e) => setFormData({ ...formData, maxMembersCount: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="roomPicture">Room Picture URL</Label>
              <Input
                id="roomPicture"
                value={formData.roomPicture}
                onChange={(e) => setFormData({ ...formData, roomPicture: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date (Optional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isLocked"
                  checked={formData.isLocked}
                  onCheckedChange={(checked) => setFormData({ ...formData, isLocked: checked as boolean })}
                />
                <Label htmlFor="isLocked">Private Room (Requires approval to join)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVisible"
                  checked={formData.isVisible}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked as boolean })}
                />
                <Label htmlFor="isVisible">Visible in public listings</Label>
              </div>
            </div>
          </div>
          
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
            <DialogTitle>Room Details</DialogTitle>
          </DialogHeader>
          
          {selectedRoom && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {selectedRoom.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  {selectedRoom.name}
                </h3>
                {selectedRoom.description && (
                  <p className="text-muted-foreground">{selectedRoom.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Activity</Label>
                  <p>{selectedRoom.activity}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedRoom.status)}>
                    {selectedRoom.status}
                  </Badge>
                </div>
                <div>
                  <Label>Creator</Label>
                  <p>{selectedRoom.creatorId}</p>
                </div>
                <div>
                  <Label>Room Type</Label>
                  <p>{selectedRoom.isLocked ? "Private" : "Public"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Members</Label>
                  <p>{selectedRoom.currentMembersCount}/{selectedRoom.maxMembersCount}</p>
                </div>
                <div>
                  <Label>Join Points</Label>
                  <p>{(selectedRoom.joinPointsRequired ?? 0) > 0 ? `${selectedRoom.joinPointsRequired} points` : "Free"}</p>
                </div>
                <div>
                  <Label>Visibility</Label>
                  <p>{selectedRoom.isVisible ? "Visible" : "Hidden"}</p>
                </div>
              </div>
              
              {(selectedRoom.startDate || selectedRoom.endDate) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRoom.startDate && (
                    <div>
                      <Label>Start Date</Label>
                      <p>{new Date(selectedRoom.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  {selectedRoom.endDate && (
                    <div>
                      <Label>End Date</Label>
                      <p>{new Date(selectedRoom.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h4 className="font-semibold">Room Statistics</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label>Total Activities</Label>
                    <p>{selectedRoom.totalActivitiesCompleted}</p>
                  </div>
                  <div>
                    <Label>Total Points Earned</Label>
                    <p>{selectedRoom.totalPointsEarned}</p>
                  </div>
                  <div>
                    <Label>Total Duration</Label>
                    <p>{selectedRoom.totalDuration} mins</p>
                  </div>
                </div>
              </div>
              
              {selectedRoom.memberProfileIds && selectedRoom.memberProfileIds.length > 0 && (
                <div>
                  <h4 className="font-semibold">Members ({selectedRoom.memberProfileIds.length})</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="list-disc list-inside">
                      {selectedRoom.memberProfileIds.map((memberId, index) => (
                        <li key={index} className="text-sm">
                          {memberId} {memberId === selectedRoom.creatorId && <Badge variant="secondary" className="ml-2">Creator</Badge>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {selectedRoom.isLocked && selectedRoom.joinRequests && selectedRoom.joinRequests.length > 0 && (
                <div>
                  <h4 className="font-semibold">Join Requests ({selectedRoom.joinRequests.filter(r => r.status === "pending").length} pending)</h4>
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Profile ID</TableHead>
                          <TableHead>Requested At</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRoom.joinRequests.map((request, index) => (
                          <TableRow key={index}>
                            <TableCell>{request.profileId}</TableCell>
                            <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={
                                request.status === "pending" ? "secondary" :
                                request.status === "approved" ? "default" : "destructive"
                              }>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{request.message || "-"}</TableCell>
                            <TableCell>
                              {request.status === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleProcessJoinRequest(selectedRoom.roomId, request.profileId, "approve")}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleProcessJoinRequest(selectedRoom.roomId, request.profileId, "reject")}
                                  >
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              
              {selectedRoom.tags && selectedRoom.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold">Tags</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRoom.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
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