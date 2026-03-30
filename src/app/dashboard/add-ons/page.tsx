"use client"

import { useState, useEffect } from "react"
import { productAddOnService, productCategoryService } from "@/lib/api-client"
import { DataTable } from "@/components/ui/data-table"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/ui/image-upload"
import { formatPrice, getCurrencyLabel } from "@/utils/currency"
import { ProductAddOn as ApiProductAddOn, ProductCategory, ApiError } from "@/types/api"

interface ProductAddOn extends ApiProductAddOn {
  addOnId: string
}

interface ExtendedProductCategory extends ProductCategory {
  productCategoryId?: string
}

const ADD_ON_CATEGORIES = [
  { value: "sauce", label: "Sauce" },
  { value: "extra", label: "Extra" },
  { value: "drink", label: "Drink" },
  { value: "dessert", label: "Dessert" },
  { value: "side", label: "Side" },
  { value: "topping", label: "Topping" },
  { value: "other", label: "Other" },
]

export default function AddOnsPage() {
  const [addOns, setAddOns] = useState<ProductAddOn[]>([])
  const [productCategories, setProductCategories] = useState<ExtendedProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedAddOn, setSelectedAddOn] = useState<ProductAddOn | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    price: 0,
    category: "other",
    image: "",
    available: true,
    maxQuantity: 5,
    minQuantity: 0,
    applicableCategories: [] as string[],
    active: true,
    sortOrder: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [addOnsRes, categoriesRes] = await Promise.all([
        productAddOnService.findAll(),
        productCategoryService.findAll(),
      ])
      
      setAddOns(addOnsRes.data || addOnsRes || [])
      setProductCategories(categoriesRes.data || categoriesRes || [])
    } catch (error) {
      toast({
        title: "Error",
        description: (error as ApiError).response?.data?.message || "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name_en.trim()) {
      toast({
        title: "Missing name",
        description: "Provide at least the English name before saving.",
        variant: "destructive",
      })
      return
    }

    const englishName = formData.name_en.trim()
    const arabicName = formData.name_ar.trim()
    const englishDescription = formData.description_en.trim()
    const arabicDescription = formData.description_ar.trim()

    try {
      const payload = {
        name_en: englishName,
        name_ar: arabicName || undefined,
        description_en: englishDescription || undefined,
        description_ar: arabicDescription || undefined,
        name: englishName,
        description: englishDescription || undefined,
        price: Number(formData.price),
        category: formData.category,
        image: formData.image || undefined,
        available: formData.available,
        active: formData.active,
        maxQuantity: Number(formData.maxQuantity),
        minQuantity: Number(formData.minQuantity),
        applicableCategories: formData.applicableCategories,
        sortOrder: Number(formData.sortOrder),
        ...(formData.calories && { calories: Number(formData.calories) }),
        ...(formData.protein && { protein: Number(formData.protein) }),
        ...(formData.carbs && { carbs: Number(formData.carbs) }),
        ...(formData.fat && { fat: Number(formData.fat) }),
      }

      await productAddOnService.create(payload)
      toast({
        title: "Success",
        description: "Add-on created successfully",
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as ApiError).response?.data?.message || "Failed to create add-on",
        variant: "destructive",
      })
    }
  }

  const handleEdit = async () => {
    if (!selectedAddOn) return
    
    if (!formData.name_en.trim()) {
      toast({
        title: "Missing name",
        description: "Provide at least the English name before saving.",
        variant: "destructive",
      })
      return
    }

    const englishName = formData.name_en.trim()
    const arabicName = formData.name_ar.trim()
    const englishDescription = formData.description_en.trim()
    const arabicDescription = formData.description_ar.trim()

    try {
      const payload = {
        name_en: englishName,
        name_ar: arabicName || undefined,
        description_en: englishDescription || undefined,
        description_ar: arabicDescription || undefined,
        name: englishName,
        description: englishDescription || undefined,
        price: Number(formData.price),
        category: formData.category,
        image: formData.image || undefined,
        available: formData.available,
        active: formData.active,
        maxQuantity: Number(formData.maxQuantity),
        minQuantity: Number(formData.minQuantity),
        applicableCategories: formData.applicableCategories,
        sortOrder: Number(formData.sortOrder),
        calories: formData.calories ? Number(formData.calories) : undefined,
        protein: formData.protein ? Number(formData.protein) : undefined,
        carbs: formData.carbs ? Number(formData.carbs) : undefined,
        fat: formData.fat ? Number(formData.fat) : undefined,
      }

      await productAddOnService.update(selectedAddOn.addOnId, payload)
      toast({
        title: "Success",
        description: "Add-on updated successfully",
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as ApiError).response?.data?.message || "Failed to update add-on",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedAddOn) return
    
    try {
      await productAddOnService.remove(selectedAddOn.addOnId)
      toast({
        title: "Success",
        description: "Add-on deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      setSelectedAddOn(null)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as ApiError).response?.data?.message || "Failed to delete add-on",
        variant: "destructive",
      })
    }
  }

  const handleToggleAvailability = async (addOn: ProductAddOn) => {
    try {
      await productAddOnService.toggleAvailability(addOn.addOnId)
      toast({
        title: "Success",
        description: `Add-on ${addOn.available ? 'disabled' : 'enabled'} successfully`,
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as ApiError).response?.data?.message || "Failed to toggle availability",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name_en: "",
      name_ar: "",
      description_en: "",
      description_ar: "",
      price: 0,
      category: "other",
      image: "",
      available: true,
      maxQuantity: 5,
      minQuantity: 0,
      applicableCategories: [],
      active: true,
      sortOrder: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    })
    setSelectedAddOn(null)
  }

  const openEditDialog = (addOn: ProductAddOn) => {
    setSelectedAddOn(addOn)
    setFormData({
      name_en: addOn.name_en || addOn.name || "",
      name_ar: addOn.name_ar || "",
      description_en: addOn.description_en || addOn.description || "",
      description_ar: addOn.description_ar || "",
      price: addOn.price,
      category: addOn.category,
      image: addOn.image || "",
      available: addOn.available ?? true,
      maxQuantity: addOn.maxQuantity ?? 5,
      minQuantity: addOn.minQuantity ?? 0,
      applicableCategories: addOn.applicableCategories || [],
      active: addOn.active ?? true,
      sortOrder: addOn.sortOrder ?? 0,
      calories: addOn.calories || 0,
      protein: addOn.protein || 0,
      carbs: addOn.carbs || 0,
      fat: addOn.fat || 0,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (addOn: ProductAddOn) => {
    setSelectedAddOn(addOn)
    setIsDeleteDialogOpen(true)
  }

  const filteredAddOns = filterCategory === "all" 
    ? addOns 
    : addOns.filter(a => a.category === filterCategory)

  const columns = [
    {
      key: "addOnId",
      header: "ID",
      sortable: true,
    },
    {
      key: "name_en",
      header: "Name (EN)",
      sortable: true,
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return addOn.name_en || addOn.name
      },
    },
    {
      key: "name_ar",
      header: "Name (AR)",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return addOn.name_ar || <span className="text-gray-400">Not provided</span>
      },
    },
    {
      key: "category",
      header: "Category",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return (
          <Badge variant="outline">
            {ADD_ON_CATEGORIES.find(c => c.value === addOn.category)?.label || addOn.category}
          </Badge>
        )
      },
    },
    {
      key: "price",
      header: "Price",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return formatPrice(addOn.price)
      },
      sortable: true,
    },
    {
      key: "quantity",
      header: "Quantity Range",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return `${addOn.minQuantity}-${addOn.maxQuantity}`
      },
    },
    {
      key: "available",
      header: "Available",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return (
          <Badge variant={addOn.available ? "default" : "secondary"}>
            {addOn.available ? "Yes" : "No"}
          </Badge>
        )
      },
    },
    {
      key: "active",
      header: "Status",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return (
          <Badge variant={addOn.active ? "default" : "secondary"}>
            {addOn.active ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      key: "nutrition",
      header: "Nutrition",
      render: (item: Record<string, unknown>) => {
        const addOn = item as unknown as ProductAddOn
        return (
          addOn.calories ? (
            <span className="text-xs">
              {addOn.calories}cal
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )
        )
      },
    },
  ]

  const actions = (item: Record<string, unknown>) => {
    const addOn = item as unknown as ProductAddOn
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleAvailability(addOn)}
          title={addOn.available ? "Disable" : "Enable"}
        >
          {addOn.available ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditDialog(addOn)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDeleteDialog(addOn)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Add-ons</CardTitle>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ADD_ON_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Add-on
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading add-ons...</div>
          ) : (
            <DataTable
              data={filteredAddOns as unknown as Record<string, unknown>[]}
              columns={columns}
              actions={actions}
              searchPlaceholder="Search add-ons..."
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} 
              onOpenChange={isCreateDialogOpen ? setIsCreateDialogOpen : setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? "Create Add-on" : "Edit Add-on"}
            </DialogTitle>
            <DialogDescription>
            {isCreateDialogOpen 
                ? "Add a new product add-on to your catalog." 
                : "Update the add-on details."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Localized Content</Label>
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                      <TabsTrigger value="ar">🇦🇪 Arabic</TabsTrigger>
                    </TabsList>

                    <TabsContent value="en" className="space-y-3 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_en">Name (English)</Label>
                        <Input
                          id="name_en"
                          value={formData.name_en}
                          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                          placeholder="e.g., Extra Sauce"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_en">Description (English)</Label>
                        <Input
                          id="description_en"
                          value={formData.description_en}
                          onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ar" className="space-y-3 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_ar">Name (Arabic)</Label>
                        <Input
                          id="name_ar"
                          dir="rtl"
                          value={formData.name_ar}
                          onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                          placeholder="مثال: صلصة إضافية"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_ar">Description (Arabic)</Label>
                        <Input
                          id="description_ar"
                          dir="rtl"
                          value={formData.description_ar}
                          onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                          placeholder="وصف اختياري"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADD_ON_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">{getCurrencyLabel()}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <ImageUpload
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  uploadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/v1/product-addon/upload-image`}
                  label="Add-on Image"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="available">Available</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="restrictions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minQuantity">Minimum Quantity</Label>
                  <Input
                    id="minQuantity"
                    type="number"
                    min="0"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="maxQuantity">Maximum Quantity</Label>
                  <Input
                    id="maxQuantity"
                    type="number"
                    min="1"
                    value={formData.maxQuantity}
                    onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
              </div>

              <div>
                <Label>Applicable Categories</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Select product categories this add-on can be used with. Leave empty for global availability.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {productCategories.map((cat) => (
                    <div key={cat._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`cat-${cat._id}`}
                        checked={formData.applicableCategories.includes((cat as ExtendedProductCategory).productCategoryId || cat.name_en || cat.name)}
                        onChange={(e) => {
                          const categoryId = (cat as ExtendedProductCategory).productCategoryId || cat.name_en || cat.name
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              applicableCategories: [...formData.applicableCategories, categoryId]
                            })
                          } else {
                            setFormData({
                              ...formData,
                              applicableCategories: formData.applicableCategories.filter(id => id !== categoryId)
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`cat-${cat._id}`} className="font-normal">
                        {cat.name_en || cat.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="space-y-4">
              <p className="text-sm text-gray-500">
                Optional nutrition information per serving
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="calories">Calories</Label>
                  <Input
                    id="calories"
                    type="number"
                    min="0"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.carbs}
                    onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.fat}
                    onChange={(e) => setFormData({ ...formData, fat: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={isCreateDialogOpen ? handleCreate : handleEdit}>
              {isCreateDialogOpen ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Add-on"
        description={`Are you sure you want to delete "${selectedAddOn?.name_en || selectedAddOn?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
