"use client"

import { useState, useEffect, useCallback } from "react"
import { gameFeatureService } from "@/lib/api-client"
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
  Gamepad2,
  DollarSign,
  Star,
  Users,
  Trophy,
  Settings,
  BarChart3
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

enum FeatureCategory {
  ENTRY = 'ENTRY',
  PRIVATE_CHALLENGE = 'PRIVATE_CHALLENGE',
  COMPETITION = 'COMPETITION',
  MEDAL = 'MEDAL',
}

enum FeatureType {
  GAME_ZONE_ENTRY = 'GAME_ZONE_ENTRY',
  PRIVATE_CHALLENGE_CREATE = 'PRIVATE_CHALLENGE_CREATE',
  PRIVATE_CHALLENGE_JOIN = 'PRIVATE_CHALLENGE_JOIN',
  PUBLIC_COMPETITION = 'PUBLIC_COMPETITION',
  PRIVATE_COMPETITION = 'PRIVATE_COMPETITION',
  GOLD_MEDAL = 'GOLD_MEDAL',
  SILVER_MEDAL = 'SILVER_MEDAL',
  BRONZE_MEDAL = 'BRONZE_MEDAL',
}

interface GameFeature {
  _id: string
  featureId: FeatureType
  name: string
  description: string
  category: FeatureCategory
  cost: number
  isActive: boolean
  isAdminOnly: boolean
  displayOrder: number
  metadata: Record<string, unknown>
  requirements: string[]
  usageCount: number
  totalRevenue: number
  createdAt: string
  updatedAt: string
}

export default function GameFeaturesPage() {
  const [features, setFeatures] = useState<GameFeature[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<GameFeature | null>(null)
  const [formData, setFormData] = useState({
    featureId: '' as FeatureType,
    name: "",
    description: "",
    category: '' as FeatureCategory,
    cost: 0,
    isActive: true,
    isAdminOnly: false,
    displayOrder: 0,
    metadata: {},
    requirements: [] as string[],
  })
  const [newRequirement, setNewRequirement] = useState("")
  const { toast } = useToast()

  const fetchFeatures = useCallback(async () => {
    try {
      const response = await gameFeatureService.getFeatures()
      setFeatures(response.data || response)
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch features",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    fetchFeatures()
  }, [fetchFeatures])

  const handleCreate = async () => {
    try {
      await gameFeatureService.createFeature(formData)
      toast({
        title: "Success",
        description: "Game feature created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchFeatures()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to create feature",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedFeature) return

    try {
      await gameFeatureService.updateFeature(selectedFeature._id, formData)
      toast({
        title: "Success",
        description: "Game feature updated successfully",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchFeatures()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update feature",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedFeature) return

    try {
      await gameFeatureService.deleteFeature(selectedFeature._id)
      toast({
        title: "Success",
        description: "Game feature deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchFeatures()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to delete feature",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (featureId: string) => {
    try {
      await gameFeatureService.toggleFeatureStatus(featureId)
      toast({
        title: "Success",
        description: "Feature status updated",
      })
      fetchFeatures()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const handleInitializeDefaults = async () => {
    try {
      await gameFeatureService.initializeDefaults()
      toast({
        title: "Success",
        description: "Default features initialized successfully",
      })
      fetchFeatures()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to initialize defaults",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      featureId: '' as FeatureType,
      name: "",
      description: "",
      category: '' as FeatureCategory,
      cost: 0,
      isActive: true,
      isAdminOnly: false,
      displayOrder: 0,
      metadata: {},
      requirements: [],
    })
    setNewRequirement("")
    setSelectedFeature(null)
  }

  const openEditDialog = (feature: GameFeature) => {
    setSelectedFeature(feature)
    setFormData({
      featureId: feature.featureId,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      cost: feature.cost,
      isActive: feature.isActive,
      isAdminOnly: feature.isAdminOnly,
      displayOrder: feature.displayOrder,
      metadata: feature.metadata || {},
      requirements: feature.requirements || [],
    })
    setIsEditDialogOpen(true)
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      })
      setNewRequirement("")
    }
  }

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    })
  }

  const getCategoryIcon = (category: FeatureCategory) => {
    switch (category) {
      case FeatureCategory.ENTRY:
        return <Gamepad2 className="h-3 w-3" />
      case FeatureCategory.PRIVATE_CHALLENGE:
        return <Users className="h-3 w-3" />
      case FeatureCategory.COMPETITION:
        return <Trophy className="h-3 w-3" />
      case FeatureCategory.MEDAL:
        return <Star className="h-3 w-3" />
      default:
        return <Settings className="h-3 w-3" />
    }
  }

  const getCategoryColor = (category: FeatureCategory) => {
    switch (category) {
      case FeatureCategory.ENTRY:
        return "bg-blue-100 text-blue-800"
      case FeatureCategory.PRIVATE_CHALLENGE:
        return "bg-purple-100 text-purple-800"
      case FeatureCategory.COMPETITION:
        return "bg-orange-100 text-orange-800"
      case FeatureCategory.MEDAL:
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const columns: Column<GameFeature>[] = [
    {
      key: "featureId",
      header: "Feature ID",
      render: (feature: GameFeature) => (
        <span className="font-mono text-xs">{feature.featureId}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (feature: GameFeature) => (
        <div>
          <div className="font-medium">{feature.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {feature.description}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (feature: GameFeature) => (
        <Badge className={`${getCategoryColor(feature.category)} flex items-center gap-1`}>
          {getCategoryIcon(feature.category)}
          {feature.category.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "cost",
      header: "Cost",
      render: (feature: GameFeature) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          <span className="font-medium">
            {feature.cost} {feature.cost === 0 ? (feature.isAdminOnly ? '(Admin)' : '(Free)') : 'pts'}
          </span>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (feature: GameFeature) => (
        <div className="text-center">
          <div className="text-sm font-medium">{feature.usageCount}</div>
          <div className="text-xs text-muted-foreground">
            {feature.totalRevenue} pts revenue
          </div>
        </div>
      ),
    },
    {
      key: "requirements",
      header: "Requirements",
      render: (feature: GameFeature) => (
        <div className="space-y-1">
          {feature.requirements && feature.requirements.length > 0 ? (
            feature.requirements.slice(0, 2).map((req, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {req}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">None</span>
          )}
          {feature.requirements && feature.requirements.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{feature.requirements.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (feature: GameFeature) => (
        <Switch
          checked={feature.isActive}
          onCheckedChange={() => handleToggleStatus(feature._id)}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (feature: GameFeature) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(feature)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedFeature(feature)
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  const activeFeatures = features.filter(f => f.isActive).length
  const totalRevenue = features.reduce((sum, f) => sum + f.totalRevenue, 0)
  const totalUsage = features.reduce((sum, f) => sum + f.usageCount, 0)
  const averageCost = features.length > 0
    ? Math.round(features.filter(f => f.cost > 0).reduce((sum, f) => sum + f.cost, 0) / features.filter(f => f.cost > 0).length)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Game Zone Features</h1>
          <p className="text-muted-foreground">
            Manage game zone features, pricing, and requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchFeatures} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleInitializeDefaults} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Initialize Defaults
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Features</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFeatures}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <div className="text-xs text-muted-foreground">
              {totalRevenue} points revenue
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageCost} pts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Features</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<GameFeature>
            columns={columns}
            data={features}
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
              {isEditDialogOpen ? "Edit Feature" : "Create Feature"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? "Update the feature details below"
                : "Fill in the details to create a new feature"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Feature ID and Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="featureId">Feature ID</Label>
                <Select
                  value={formData.featureId}
                  onValueChange={(value) => setFormData({ ...formData, featureId: value as FeatureType })}
                  disabled={isEditDialogOpen}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select feature type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FeatureType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Feature Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Enter Game Zone"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Feature description"
              />
            </div>

            {/* Category and Cost */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as FeatureCategory })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FeatureCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost (Points)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label>Requirements</Label>
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement (e.g., GOLD_MEDAL)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.requirements.map((requirement, index) => (
                  <Badge key={index} variant="secondary">
                    {requirement}
                    <button
                      className="ml-2 text-xs"
                      onClick={() => removeRequirement(index)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Feature is active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAdminOnly"
                  checked={formData.isAdminOnly}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAdminOnly: checked })}
                />
                <Label htmlFor="isAdminOnly">Admin only feature</Label>
              </div>
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
        title="Delete Feature"
        description={`Are you sure you want to delete "${selectedFeature?.name}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  )
}