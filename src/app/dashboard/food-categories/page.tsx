"use client";

import { useState, useEffect } from "react";
import { foodCategoryService } from "@/lib/api-client";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import Image from "next/image";
import { FoodCategory as ApiFoodCategory, ApiError } from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface FoodCategory extends ApiFoodCategory {
  foodCategoryId: string;
  products: string[];
}

export default function FoodCategoriesPage() {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    image: "",
    active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await foodCategoryService.findAll();
      setCategories(response as FoodCategory[]);
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as ApiError).response?.data?.message ||
          "Failed to fetch food categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name_en.trim()) {
      toast({
        title: "Missing name",
        description: "Provide at least the English name before saving.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      name_en: formData.name_en.trim(),
      name_ar: formData.name_ar.trim() || undefined,
      description_en: formData.description_en.trim() || undefined,
      description_ar: formData.description_ar.trim() || undefined,
    };

    try {
      await foodCategoryService.create(payload);
      toast({
        title: "Success",
        description: "Food category created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as ApiError).response?.data?.message ||
          "Failed to create food category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory) return;

    if (!formData.name_en.trim()) {
      toast({
        title: "Missing name",
        description: "Provide at least the English name before saving.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      name_en: formData.name_en.trim(),
      name_ar: formData.name_ar.trim() || undefined,
      description_en: formData.description_en.trim() || undefined,
      description_ar: formData.description_ar.trim() || undefined,
    };

    try {
      await foodCategoryService.update(
        selectedCategory.foodCategoryId ?? selectedCategory._id,
        payload
      );
      toast({
        title: "Success",
        description: "Food category updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as ApiError).response?.data?.message ||
          "Failed to update food category",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await foodCategoryService.remove(
        selectedCategory.foodCategoryId ?? selectedCategory._id
      );
      toast({
        title: "Success",
        description: "Food category deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description:
          (error as ApiError).response?.data?.message ||
          "Failed to delete food category",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: "",
      name_ar: "",
      description_en: "",
      description_ar: "",
      image: "",
      active: true,
    });
    setSelectedCategory(null);
  };

  const openEditDialog = (category: FoodCategory) => {
    setSelectedCategory(category);
    setFormData({
      name_en: category.name_en || category.name || "",
      name_ar: category.name_ar || "",
      description_en: category.description_en || "",
      description_ar: category.description_ar || "",
      image: category.image || "",
      active: category.active ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: FoodCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const columns = [
    {
      key: "foodCategoryId",
      header: "ID",
      sortable: true,
    },
    {
      key: "name_en",
      header: "Name (EN)",
      sortable: true,
      render: (item: Record<string, unknown>) => {
        const category = item as unknown as FoodCategory;
        return category.name_en || category.name;
      },
    },
    {
      key: "name_ar",
      header: "Name (AR)",
      render: (item: Record<string, unknown>) => {
        const category = item as unknown as FoodCategory;
        return (
          category.name_ar || (
            <span className="text-muted-foreground">Not provided</span>
          )
        );
      },
    },
    {
      key: "image",
      header: "Image",
      render: (item: Record<string, unknown>) => {
        const category = item as unknown as FoodCategory;
        return category.image ? (
          <Image
            src={category.image}
            alt={category.name_en || category.name}
            width={40}
            height={40}
            className="object-cover rounded"
          />
        ) : (
          <span className="text-gray-400">No image</span>
        );
      },
    },
    {
      key: "products",
      header: "Products",
      render: (item: Record<string, unknown>) => {
        const category = item as unknown as FoodCategory;
        return <span>{category.products?.length || 0} products</span>;
      },
    },
    {
      key: "active",
      header: "Status",
      render: (item: Record<string, unknown>) => {
        const category = item as unknown as FoodCategory;
        return (
          <Badge variant={category.active ? "default" : "secondary"}>
            {category.active ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
  ];

  const actions = (item: Record<string, unknown>) => {
    const category = item as unknown as FoodCategory;
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEditDialog(category)}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openDeleteDialog(category)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Food Categories</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCategories}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading food categories...</div>
          ) : (
            <DataTable
              data={categories as unknown as Record<string, unknown>[]}
              columns={columns}
              actions={actions}
              searchPlaceholder="Search food categories..."
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Food Category</DialogTitle>
            <DialogDescription>
              Add a new food category to organize your food items.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
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
                      onChange={(e) =>
                        setFormData({ ...formData, name_en: e.target.value })
                      }
                      placeholder="e.g., Breakfast"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">
                      Description (English)
                    </Label>
                    <Textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_en: e.target.value,
                        })
                      }
                      placeholder="Optional details shown to English readers"
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
                      onChange={(e) =>
                        setFormData({ ...formData, name_ar: e.target.value })
                      }
                      placeholder="مثال: الفطور"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_ar">Description (Arabic)</Label>
                    <Textarea
                      id="description_ar"
                      dir="rtl"
                      value={formData.description_ar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_ar: e.target.value,
                        })
                      }
                      placeholder="تفاصيل اختيارية للعرض باللغة العربية"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                uploadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/v1/food-category/upload-image`}
                label="Category Image"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Food Category</DialogTitle>
            <DialogDescription>
              Update the food category details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Localized Content</Label>
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                  <TabsTrigger value="ar">🇦🇪 Arabic</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name_en">Name (English)</Label>
                    <Input
                      id="edit-name_en"
                      value={formData.name_en}
                      onChange={(e) =>
                        setFormData({ ...formData, name_en: e.target.value })
                      }
                      placeholder="e.g., Breakfast"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description_en">
                      Description (English)
                    </Label>
                    <Textarea
                      id="edit-description_en"
                      value={formData.description_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_en: e.target.value,
                        })
                      }
                      placeholder="Optional details shown to English readers"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="ar" className="space-y-3 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name_ar">Name (Arabic)</Label>
                    <Input
                      id="edit-name_ar"
                      dir="rtl"
                      value={formData.name_ar}
                      onChange={(e) =>
                        setFormData({ ...formData, name_ar: e.target.value })
                      }
                      placeholder="مثال: الفطور"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description_ar">
                      Description (Arabic)
                    </Label>
                    <Textarea
                      id="edit-description_ar"
                      dir="rtl"
                      value={formData.description_ar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_ar: e.target.value,
                        })
                      }
                      placeholder="تفاصيل اختيارية للعرض باللغة العربية"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                uploadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/v1/food-category/upload-image`}
                label="Category Image"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Food Category"
        description={`Are you sure you want to delete "${
          selectedCategory?.name_en || selectedCategory?.name
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
