"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { competitionService } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import {
  Competition,
  ApiError,
  PointDistribution,
  CompetitionRules,
} from "@/types/api";
import {
  Pencil,
  Trash2,
  Plus,
  Eye,
  Trophy,
  Users,
  MapPin,
  Activity as ActivityIcon,
} from "lucide-react";
import { formatCurrency } from "@/utils/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";

// Extend Competition type for additional properties used in dashboard
interface ExtendedCompetition extends Competition {
  competitionId: string;
  isLocked?: boolean;
  totalActivitiesCompleted?: number;
  totalPointsDistributed?: number;
  winners?: string[];
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<ExtendedCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] =
    useState<ExtendedCompetition | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    competitionType: "",
    mode: "",
  });
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subtitle: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    competitionType: "running" as
      | "running"
      | "cycling"
      | "swimming"
      | "walking"
      | "gym"
      | "yoga"
      | "custom",
    customActivityType: "",
    difficulty: "beginner" as
      | "beginner"
      | "intermediate"
      | "advanced"
      | "expert",
    mode: "weekly" as "weekly" | "monthly" | "custom",
    pointsDistribution: [
      { position: 1, points: 100, badge: "Gold" },
      { position: 2, points: 50, badge: "Silver" },
      { position: 3, points: 25, badge: "Bronze" },
    ] as PointDistribution[],
    rules: {
      title: "",
      description: "",
      conditions: [] as string[],
      eligibilityCriteria: [] as string[],
      disqualificationRules: [] as string[],
    } as CompetitionRules,
    location: "",
    locationRadius: 5,
    competitionImage: "",
    maxParticipants: 0,
    entryFee: 0,
    sponsorName: "",
    sponsorLogo: "",
    sponsorWebsite: "",
    sponsorDescription: "",
  });

  useEffect(() => {
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const data = await competitionService.findAll(filters);
      setCompetitions(Array.isArray(data) ? data : data.competitions || []);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to fetch competitions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const dataToSend = {
        ...formData,
        creatorId: user?.profileId || "",
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline
          ? new Date(formData.registrationDeadline)
          : undefined,
      };
      await competitionService.create(dataToSend);
      toast({
        title: "Success",
        description: "Competition created successfully",
      });
      setIsCreateOpen(false);
      fetchCompetitions();
      resetForm();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to create competition",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedCompetition) return;

    try {
      const dataToSend = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        registrationDeadline: formData.registrationDeadline
          ? new Date(formData.registrationDeadline)
          : undefined,
      };
      await competitionService.update(
        selectedCompetition.competitionId,
        dataToSend
      );
      toast({
        title: "Success",
        description: "Competition updated successfully",
      });
      setIsEditOpen(false);
      fetchCompetitions();
      resetForm();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to update competition",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (competition: ExtendedCompetition) => {
    if (!confirm(`Are you sure you want to delete "${competition.name}"?`))
      return;

    try {
      await competitionService.remove(competition.competitionId);
      toast({
        title: "Success",
        description: "Competition deleted successfully",
      });
      fetchCompetitions();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to delete competition",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (competition: ExtendedCompetition) => {
    try {
      // await competitionService.activate(competition.competitionId, user?.profileId || "")
      await competitionService.activate(competition.competitionId);
      toast({
        title: "Success",
        description: "Competition activated successfully",
      });
      fetchCompetitions();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to activate competition",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      subtitle: "",
      startDate: "",
      endDate: "",
      registrationDeadline: "",
      competitionType: "running",
      customActivityType: "",
      difficulty: "beginner",
      mode: "weekly",
      pointsDistribution: [
        { position: 1, points: 100, badge: "Gold" },
        { position: 2, points: 50, badge: "Silver" },
        { position: 3, points: 25, badge: "Bronze" },
      ] as PointDistribution[],
      rules: {
        title: "",
        description: "",
        conditions: [],
        eligibilityCriteria: [],
        disqualificationRules: [],
      } as CompetitionRules,
      location: "",
      locationRadius: 5,
      competitionImage: "",
      maxParticipants: 0,
      entryFee: 0,
      sponsorName: "",
      sponsorLogo: "",
      sponsorWebsite: "",
      sponsorDescription: "",
    });
    setSelectedCompetition(null);
  };

  const openEditDialog = (competition: ExtendedCompetition) => {
    setSelectedCompetition(competition);
    setFormData({
      name: competition.name,
      description: competition.description,
      subtitle: competition.subtitle || "",
      startDate: new Date(competition.startDate).toISOString().split("T")[0],
      endDate: new Date(competition.endDate).toISOString().split("T")[0],
      registrationDeadline: competition.registrationDeadline
        ? new Date(competition.registrationDeadline).toISOString().split("T")[0]
        : "",
      competitionType: competition.competitionType,
      customActivityType: competition.customActivityType || "",
      difficulty: competition.difficulty || "beginner",
      mode: competition.mode,
      pointsDistribution: competition.pointsDistribution,
      rules: competition.rules || {
        title: "",
        description: "",
        conditions: [],
        eligibilityCriteria: [],
        disqualificationRules: [],
      },
      location: competition.location,
      locationRadius: competition.locationRadius || 5,
      competitionImage: competition.competitionImage || "",
      maxParticipants: competition.maxParticipants || 0,
      entryFee: competition.entryFee || 0,
      sponsorName: competition.sponsorName || "",
      sponsorLogo: competition.sponsorLogo || "",
      sponsorWebsite: competition.sponsorWebsite || "",
      sponsorDescription: competition.sponsorDescription || "",
    });
    setIsEditOpen(true);
  };

  const openViewDialog = async (competition: ExtendedCompetition) => {
    setSelectedCompetition(competition);
    setIsViewOpen(true);

    // Fetch statistics
    try {
      const stats = await competitionService.getStatistics();
      setSelectedCompetition({ ...competition, ...stats });
    } catch (error) {
      console.error("Failed to fetch competition statistics:", error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "draft":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getModeBadgeVariant = (mode: string) => {
    switch (mode) {
      case "weekly":
        return "secondary";
      case "monthly":
        return "default";
      case "custom":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Competitions Management</CardTitle>
              <CardDescription>
                Manage all competitions and their participants
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Competition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select
              value={filters.competitionType}
              onValueChange={(value) =>
                setFilters({ ...filters, competitionType: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Types</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="cycling">Cycling</SelectItem>
                <SelectItem value="swimming">Swimming</SelectItem>
                <SelectItem value="walking">Walking</SelectItem>
                <SelectItem value="gym">Gym</SelectItem>
                <SelectItem value="yoga">Yoga</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.mode}
              onValueChange={(value) => setFilters({ ...filters, mode: value })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">All Modes</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableCaption>
              A list of all competitions in the system
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Entry Fee</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : competitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No competitions found
                  </TableCell>
                </TableRow>
              ) : (
                competitions.map((competition) => (
                  <TableRow key={competition._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {competition.name}
                        {competition.sponsorName && (
                          <Badge variant="default">Sponsored</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ActivityIcon className="h-3 w-3" />
                        {competition.competitionType === "custom"
                          ? competition.customActivityType
                          : competition.competitionType}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getModeBadgeVariant(competition.mode)}>
                        {competition.mode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(competition.status)}
                      >
                        {competition.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {competition.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {competition.currentParticipants}/
                        {competition.maxParticipants || "∞"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {competition.entryFee && competition.entryFee > 0
                        ? formatCurrency(competition.entryFee)
                        : "Free"}
                    </TableCell>
                    <TableCell>
                      {new Date(competition.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {competition.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleActivate(competition)}
                            title="Activate"
                          >
                            <Trophy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openViewDialog(competition)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(competition)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(competition)}
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
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditOpen ? "Edit Competition" : "Create New Competition"}
            </DialogTitle>
            <DialogDescription>
              {isEditOpen
                ? "Update the competition details"
                : "Fill in the details to create a new competition"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="points">Points & Rules</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="sponsor">Sponsor</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData({ ...formData, subtitle: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="competitionType">Competition Type</Label>
                  <Select
                    value={formData.competitionType}
                    onValueChange={(value: typeof formData.competitionType) =>
                      setFormData({ ...formData, competitionType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="walking">Walking</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.competitionType === "custom" && (
                  <div>
                    <Label htmlFor="customActivityType">Custom Activity</Label>
                    <Input
                      id="customActivityType"
                      value={formData.customActivityType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customActivityType: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: typeof formData.difficulty) =>
                      setFormData({ ...formData, difficulty: value })
                    }
                  >
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
                <div>
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    value={formData.mode}
                    onValueChange={(value: typeof formData.mode) =>
                      setFormData({ ...formData, mode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
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
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registrationDeadline">
                    Registration Deadline
                  </Label>
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registrationDeadline: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">
                    Max Participants (0 = unlimited)
                  </Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="entryFee">Entry Fee (Points)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        entryFee: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="competitionImage">
                    Competition Image URL
                  </Label>
                  <Input
                    id="competitionImage"
                    value={formData.competitionImage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        competitionImage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="points" className="space-y-4">
              <div>
                <Label>Points Distribution</Label>
                <div className="space-y-2">
                  {formData.pointsDistribution.map((dist, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        placeholder="Position"
                        value={dist.position}
                        onChange={(e) => {
                          const newDist = [...formData.pointsDistribution];
                          newDist[index].position = parseInt(e.target.value);
                          setFormData({
                            ...formData,
                            pointsDistribution: newDist,
                          });
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Points"
                        value={dist.points}
                        onChange={(e) => {
                          const newDist = [...formData.pointsDistribution];
                          newDist[index].points = parseInt(e.target.value);
                          setFormData({
                            ...formData,
                            pointsDistribution: newDist,
                          });
                        }}
                      />
                      <Input
                        placeholder="Badge"
                        value={dist.badge || ""}
                        onChange={(e) => {
                          const newDist = [...formData.pointsDistribution];
                          newDist[index].badge = e.target.value;
                          setFormData({
                            ...formData,
                            pointsDistribution: newDist,
                          });
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        pointsDistribution: [
                          ...formData.pointsDistribution,
                          {
                            position: formData.pointsDistribution.length + 1,
                            points: 0,
                            badge: "",
                          },
                        ],
                      });
                    }}
                  >
                    Add Position
                  </Button>
                </div>
              </div>

              {formData.rules && (
                <>
                  <div>
                    <Label htmlFor="rulesTitle">Rules Title</Label>
                    <Input
                      id="rulesTitle"
                      value={formData.rules.title}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rules: { ...formData.rules, title: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="rulesDescription">Rules Description</Label>
                    <Textarea
                      id="rulesDescription"
                      value={formData.rules.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rules: {
                            ...formData.rules,
                            description: e.target.value,
                          },
                        })
                      }
                      rows={4}
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="locationRadius">Location Radius (km)</Label>
                <Input
                  id="locationRadius"
                  type="number"
                  value={formData.locationRadius}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationRadius: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="sponsor" className="space-y-4">
              <div>
                <Label htmlFor="sponsorName">Sponsor Name</Label>
                <Input
                  id="sponsorName"
                  value={formData.sponsorName}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsorName: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sponsorLogo">Sponsor Logo URL</Label>
                <Input
                  id="sponsorLogo"
                  value={formData.sponsorLogo}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsorLogo: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sponsorWebsite">Sponsor Website</Label>
                <Input
                  id="sponsorWebsite"
                  value={formData.sponsorWebsite}
                  onChange={(e) =>
                    setFormData({ ...formData, sponsorWebsite: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="sponsorDescription">Sponsor Description</Label>
                <Textarea
                  id="sponsorDescription"
                  value={formData.sponsorDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sponsorDescription: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
              }}
            >
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
            <DialogTitle>Competition Details</DialogTitle>
          </DialogHeader>

          {selectedCompetition && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedCompetition.name}
                </h3>
                {selectedCompetition.subtitle && (
                  <p className="text-muted-foreground">
                    {selectedCompetition.subtitle}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <p>
                    {selectedCompetition.competitionType === "custom"
                      ? selectedCompetition.customActivityType
                      : selectedCompetition.competitionType}
                  </p>
                </div>
                <div>
                  <Label>Mode</Label>
                  <Badge
                    variant={getModeBadgeVariant(selectedCompetition.mode)}
                  >
                    {selectedCompetition.mode}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge
                    variant={getStatusBadgeVariant(selectedCompetition.status)}
                  >
                    {selectedCompetition.status}
                  </Badge>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <p>{selectedCompetition.difficulty}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="whitespace-pre-wrap">
                  {selectedCompetition.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p>
                    {new Date(
                      selectedCompetition.startDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p>
                    {new Date(selectedCompetition.endDate).toLocaleDateString()}
                  </p>
                </div>
                {selectedCompetition.registrationDeadline && (
                  <div>
                    <Label>Registration Deadline</Label>
                    <p>
                      {new Date(
                        selectedCompetition.registrationDeadline
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Location</Label>
                  <p>{selectedCompetition.location}</p>
                  {selectedCompetition.locationRadius && (
                    <p className="text-sm text-muted-foreground">
                      Radius: {selectedCompetition.locationRadius} km
                    </p>
                  )}
                </div>
                <div>
                  <Label>Participants</Label>
                  <p>
                    {selectedCompetition.currentParticipants}/
                    {selectedCompetition.maxParticipants || "∞"}
                  </p>
                </div>
                <div>
                  <Label>Entry Fee</Label>
                  <p>
                    {selectedCompetition.entryFee &&
                    selectedCompetition.entryFee > 0
                      ? `${selectedCompetition.entryFee} points`
                      : "Free"}
                  </p>
                </div>
              </div>

              <div>
                <Label>Activities & Points</Label>
                <p>
                  Total Activities:{" "}
                  {selectedCompetition.totalActivitiesCompleted}
                </p>
                <p>
                  Total Points Distributed:{" "}
                  {selectedCompetition.totalPointsDistributed}
                </p>
              </div>

              {selectedCompetition.pointsDistribution &&
                selectedCompetition.pointsDistribution.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Points Distribution</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Position</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Badge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCompetition.pointsDistribution.map(
                          (dist, index) => (
                            <TableRow key={index}>
                              <TableCell>#{dist.position}</TableCell>
                              <TableCell>{dist.points}</TableCell>
                              <TableCell>{dist.badge || "-"}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {selectedCompetition.sponsorName && (
                <div>
                  <h4 className="font-semibold">Sponsor Information</h4>
                  <div className="space-y-2">
                    <p>Name: {selectedCompetition.sponsorName}</p>
                    {selectedCompetition.sponsorWebsite && (
                      <p>
                        Website:{" "}
                        <a
                          href={selectedCompetition.sponsorWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedCompetition.sponsorWebsite}
                        </a>
                      </p>
                    )}
                    {selectedCompetition.sponsorDescription && (
                      <p>
                        Description: {selectedCompetition.sponsorDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedCompetition.winners &&
                selectedCompetition.winners.length > 0 && (
                  <div>
                    <h4 className="font-semibold">Winners</h4>
                    <ol className="list-decimal list-inside">
                      {selectedCompetition.winners.map((winner, index) => (
                        <li key={index}>{winner}</li>
                      ))}
                    </ol>
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
  );
}
