"use client"

import { useState, useEffect } from "react"
import { cbyaiService } from "@/lib/api-client"
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
  Package,
  Calendar,
  Star,
  Users
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/types/api"

interface CByAIPackage {
  _id: string
  packageId: string
  // Bilingual fields
  name_en: string
  name_ar: string
  displayName_en: string
  displayName_ar: string
  description_en?: string
  description_ar?: string
  highlightFeatures_en: string[]
  highlightFeatures_ar: string[]
  // Legacy fields (for backward compatibility)
  name?: string
  displayName?: string
  highlightFeatures?: string[]
  // Non-language-specific fields
  duration: number
  price: number
  currency: string
  discountPercentage: number
  features: {
    monthlyMealCredits: number
    customMealPlans: boolean
    nutritionistSupport: boolean
    deliveryIncluded: boolean
    familySharing: boolean
    premiumRecipes: boolean
    cookingWorkshops: boolean
    vipSupport: boolean
  }
  isActive: boolean
  isTrial: boolean
  trialDays: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const formatCurrency = (value: number, currency = "AED") =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)

export default function CByAIPackagesPage() {
  const [packages, setPackages] = useState<CByAIPackage[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<CByAIPackage | null>(null)
  const [formData, setFormData] = useState({
    // Bilingual fields
    name_en: "",
    name_ar: "",
    displayName_en: "",
    displayName_ar: "",
    description_en: "",
    description_ar: "",
    highlightFeatures_en: [] as string[],
    highlightFeatures_ar: [] as string[],
    // Non-language-specific fields
    duration: 30,
    price: 0,
    currency: "AED",
    discountPercentage: 0,
    features: {
      monthlyMealCredits: 0,
      customMealPlans: true,
      nutritionistSupport: false,
      deliveryIncluded: false,
      familySharing: false,
      premiumRecipes: false,
      cookingWorkshops: false,
      vipSupport: false,
    },
    isActive: true,
    isTrial: false,
    trialDays: 0,
    sortOrder: 0,
  })
  const [newFeature_en, setNewFeature_en] = useState("")
  const [newFeature_ar, setNewFeature_ar] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchPackages()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPackages = async () => {
    try {
      const response = await cbyaiService.getPackages()
      setPackages(response.data || response)
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch packages",
        variant: "destructive",
      })
    }
  }

  const handleCreate = async () => {
    if (!validateBilingualFields()) return

    try {
      await cbyaiService.createPackage(formData)
      toast({
        title: "Success",
        description: "Package created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchPackages()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to create package",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedPackage) return
    if (!validateBilingualFields()) return

    try {
      await cbyaiService.updatePackage(selectedPackage.packageId, formData)
      toast({
        title: "Success",
        description: "Package updated successfully",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchPackages()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update package",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedPackage) return
    
    try {
      await cbyaiService.deletePackage(selectedPackage.packageId)
      toast({
        title: "Success",
        description: "Package deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchPackages()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to delete package",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (packageId: string) => {
    try {
      await cbyaiService.togglePackageStatus(packageId)
      toast({
        title: "Success",
        description: "Package status updated",
      })
      fetchPackages()
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      // Bilingual fields
      name_en: "",
      name_ar: "",
      displayName_en: "",
      displayName_ar: "",
      description_en: "",
      description_ar: "",
      highlightFeatures_en: [],
      highlightFeatures_ar: [],
      // Non-language-specific fields
      duration: 30,
      price: 0,
      currency: "AED",
      discountPercentage: 0,
      features: {
        monthlyMealCredits: 0,
        customMealPlans: true,
        nutritionistSupport: false,
        deliveryIncluded: false,
        familySharing: false,
        premiumRecipes: false,
        cookingWorkshops: false,
        vipSupport: false,
      },
      isActive: true,
      isTrial: false,
      trialDays: 0,
      sortOrder: 0,
    })
    setNewFeature_en("")
    setNewFeature_ar("")
    setSelectedPackage(null)
  }

  const openEditDialog = (pkg: CByAIPackage) => {
    setSelectedPackage(pkg)
    setFormData({
      // Bilingual fields with backward compatibility
      name_en: pkg.name_en || pkg.name || "",
      name_ar: pkg.name_ar || pkg.name || "",
      displayName_en: pkg.displayName_en || pkg.displayName || "",
      displayName_ar: pkg.displayName_ar || pkg.displayName || "",
      description_en: pkg.description_en || "",
      description_ar: pkg.description_ar || "",
      highlightFeatures_en: pkg.highlightFeatures_en || pkg.highlightFeatures || [],
      highlightFeatures_ar: pkg.highlightFeatures_ar || pkg.highlightFeatures || [],
      // Non-language-specific fields
      duration: pkg.duration,
      price: pkg.price,
      currency: pkg.currency,
      discountPercentage: pkg.discountPercentage,
      features: pkg.features,
      isActive: pkg.isActive,
      isTrial: pkg.isTrial,
      trialDays: pkg.trialDays,
      sortOrder: pkg.sortOrder,
    })
    setIsEditDialogOpen(true)
  }

  const addHighlightFeature_en = () => {
    if (newFeature_en.trim()) {
      setFormData({
        ...formData,
        highlightFeatures_en: [...formData.highlightFeatures_en, newFeature_en.trim()]
      })
      setNewFeature_en("")
    }
  }

  const addHighlightFeature_ar = () => {
    if (newFeature_ar.trim()) {
      setFormData({
        ...formData,
        highlightFeatures_ar: [...formData.highlightFeatures_ar, newFeature_ar.trim()]
      })
      setNewFeature_ar("")
    }
  }

  const removeHighlightFeature_en = (index: number) => {
    setFormData({
      ...formData,
      highlightFeatures_en: formData.highlightFeatures_en.filter((_, i) => i !== index)
    })
  }

  const removeHighlightFeature_ar = (index: number) => {
    setFormData({
      ...formData,
      highlightFeatures_ar: formData.highlightFeatures_ar.filter((_, i) => i !== index)
    })
  }

  const validateBilingualFields = (): boolean => {
    if (!formData.name_en.trim() || !formData.name_ar.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide package name in both English and Arabic",
        variant: "destructive",
      })
      return false
    }
    if (!formData.displayName_en.trim() || !formData.displayName_ar.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide display name in both English and Arabic",
        variant: "destructive",
      })
      return false
    }
    if (formData.highlightFeatures_en.length === 0 || formData.highlightFeatures_ar.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one highlight feature in both English and Arabic",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const columns: Column<CByAIPackage>[] = [
    {
      key: "packageId",
      header: "Package ID",
      render: (pkg: CByAIPackage) => (
        <span className="font-mono text-xs">{pkg.packageId}</span>
      ),
    },
    {
      key: "displayName",
      header: "Name",
      render: (pkg: CByAIPackage) => (
        <div>
          <div className="font-medium">{pkg.displayName}</div>
          <div className="text-xs text-muted-foreground">{pkg.name}</div>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (pkg: CByAIPackage) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{pkg.duration} days</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (pkg: CByAIPackage) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatCurrency(pkg.price, pkg.currency || "AED")}
          </span>
          {pkg.discountPercentage > 0 && (
            <Badge variant="secondary" className="ml-2">
              -{pkg.discountPercentage}%
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "features",
      header: "Key Features",
      render: (pkg: CByAIPackage) => (
        <div className="space-y-1">
          {pkg.features.monthlyMealCredits > 0 && (
            <Badge variant="outline" className="text-xs">
              {pkg.features.monthlyMealCredits} meals/month
            </Badge>
          )}
          {pkg.features.deliveryIncluded && (
            <Badge variant="outline" className="text-xs ml-1">
              Delivery included
            </Badge>
          )}
          {pkg.features.vipSupport && (
            <Badge variant="outline" className="text-xs ml-1">
              VIP Support
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (pkg: CByAIPackage) => (
        <Switch
          checked={pkg.isActive}
          onCheckedChange={() => handleToggleStatus(pkg.packageId)}
        />
      ),
    },
    {
      key: "isTrial",
      header: "Trial",
      render: (pkg: CByAIPackage) => (
        pkg.isTrial ? (
          <Badge variant="secondary">
            {pkg.trialDays} days trial
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (pkg: CByAIPackage) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditDialog(pkg)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedPackage(pkg)
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">C by AI Packages</h1>
          <p className="text-muted-foreground">
            Manage subscription packages for C by AI meal planning service
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchPackages} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.filter(p => p.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Packages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.filter(p => p.isTrial).length}
            </div>
          </CardContent>
        </Card>
        
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
          <Badge variant="outline">AED</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(
              packages.length > 0
                ? Math.round(
                    packages.reduce((sum, p) => sum + p.price, 0) /
                      packages.length,
                  )
                : 0,
              packages[0]?.currency || "AED",
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<CByAIPackage>
            columns={columns}
            data={packages}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Edit Package" : "Create Package"}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen 
                ? "Update the package details below" 
                : "Fill in the details to create a new package"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Bilingual Content Section */}
            <div className="space-y-2">
              <Label>Package Information</Label>
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                  <TabsTrigger value="ar">🇦🇪 Arabic</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_en">Package Name (English)</Label>
                    <Input
                      id="name_en"
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="e.g., 1 Month"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName_en">Display Name (English)</Label>
                    <Input
                      id="displayName_en"
                      value={formData.displayName_en}
                      onChange={(e) => setFormData({ ...formData, displayName_en: e.target.value })}
                      placeholder="e.g., Monthly Meal Plan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description (English) (Optional)</Label>
                    <Input
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      placeholder="e.g., Perfect for individuals..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Highlight Features (English)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newFeature_en}
                        onChange={(e) => setNewFeature_en(e.target.value)}
                        placeholder="Add a highlight feature"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlightFeature_en())}
                      />
                      <Button type="button" onClick={addHighlightFeature_en}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.highlightFeatures_en.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                          <button
                            className="ml-2 text-xs"
                            onClick={() => removeHighlightFeature_en(index)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ar" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_ar">Package Name (Arabic)</Label>
                    <Input
                      id="name_ar"
                      dir="rtl"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      placeholder="مثال: شهر واحد"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName_ar">Display Name (Arabic)</Label>
                    <Input
                      id="displayName_ar"
                      dir="rtl"
                      value={formData.displayName_ar}
                      onChange={(e) => setFormData({ ...formData, displayName_ar: e.target.value })}
                      placeholder="مثال: خطة وجبات شهرية"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_ar">Description (Arabic) (Optional)</Label>
                    <Input
                      id="description_ar"
                      dir="rtl"
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      placeholder="مثال: مثالي للأفراد..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Highlight Features (Arabic)</Label>
                    <div className="flex gap-2">
                      <Input
                        dir="rtl"
                        value={newFeature_ar}
                        onChange={(e) => setNewFeature_ar(e.target.value)}
                        placeholder="أضف ميزة بارزة"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlightFeature_ar())}
                      />
                      <Button type="button" onClick={addHighlightFeature_ar}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.highlightFeatures_ar.map((feature, index) => (
                        <Badge key={index} variant="secondary" dir="rtl">
                          {feature}
                          <button
                            className="ml-2 text-xs"
                            onClick={() => removeHighlightFeature_ar(index)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discount and Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount %</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="monthlyMealCredits" className="font-normal">
                    Monthly Meal Credits
                  </Label>
                  <Input
                    id="monthlyMealCredits"
                    type="number"
                    className="w-24"
                    value={formData.features.monthlyMealCredits}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features, monthlyMealCredits: parseInt(e.target.value) }
                    })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="customMealPlans"
                      checked={formData.features.customMealPlans}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, customMealPlans: checked }
                      })}
                    />
                    <Label htmlFor="customMealPlans" className="font-normal">
                      Custom Meal Plans
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="nutritionistSupport"
                      checked={formData.features.nutritionistSupport}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, nutritionistSupport: checked }
                      })}
                    />
                    <Label htmlFor="nutritionistSupport" className="font-normal">
                      Nutritionist Support
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="deliveryIncluded"
                      checked={formData.features.deliveryIncluded}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, deliveryIncluded: checked }
                      })}
                    />
                    <Label htmlFor="deliveryIncluded" className="font-normal">
                      Delivery Included
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="familySharing"
                      checked={formData.features.familySharing}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, familySharing: checked }
                      })}
                    />
                    <Label htmlFor="familySharing" className="font-normal">
                      Family Sharing
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="premiumRecipes"
                      checked={formData.features.premiumRecipes}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, premiumRecipes: checked }
                      })}
                    />
                    <Label htmlFor="premiumRecipes" className="font-normal">
                      Premium Recipes
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cookingWorkshops"
                      checked={formData.features.cookingWorkshops}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, cookingWorkshops: checked }
                      })}
                    />
                    <Label htmlFor="cookingWorkshops" className="font-normal">
                      Cooking Workshops
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="vipSupport"
                      checked={formData.features.vipSupport}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        features: { ...formData.features, vipSupport: checked }
                      })}
                    />
                    <Label htmlFor="vipSupport" className="font-normal">
                      VIP Support
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Trial Settings */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isTrial"
                  checked={formData.isTrial}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTrial: checked })}
                />
                <Label htmlFor="isTrial">This is a trial package</Label>
              </div>
              {formData.isTrial && (
                <div className="ml-6">
                  <Label htmlFor="trialDays">Trial Days</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    className="w-24"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Package is active</Label>
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
        title="Delete Package"
        description={`Are you sure you want to delete "${selectedPackage?.displayName}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  )
}
