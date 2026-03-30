"use client";

import { useState, useEffect } from "react";
import {
  mealComponentTemplateService,
  foodCategoryService,
} from "@/lib/api-client";

// Type definitions
interface NutritionPer100g {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface ComponentDefaultConfig {
  title: string;
  baseWeight: number;
  minWeight: number;
  maxWeight: number;
  step: number;
  basePrice: number;
  stepPrice: number;
  freeWeight: boolean;
  nutritionPer100g: NutritionPer100g;
  ingredientType?: string;
  description?: string;
}

interface MealComponentTemplate {
  _id: string;
  templateId: string;
  name: string;
  description?: string;
  foodCategory?: string; // Reference to FoodCategory.foodCategoryId
  defaultConfig: ComponentDefaultConfig;
  active: boolean;
  usageCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FoodCategory {
  _id: string;
  foodCategoryId: string;
  name_en: string;
  name?: string;
  name_ar?: string;
  description_en?: string;
  active: boolean;
}

const INGREDIENT_TYPES = ["protein", "carbs", "vegetables", "fats"];

export default function MealComponentTemplatesPage() {
  const [templates, setTemplates] = useState<MealComponentTemplate[]>([]);
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MealComponentTemplate | null>(null);
  const [foodCategoryFilter, setFoodCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  // Form state
  const [formData, setFormData] = useState<Partial<MealComponentTemplate>>({
    name: "",
    description: "",
    foodCategory: "",
    active: true,
    tags: [],
    defaultConfig: {
      title: "",
      baseWeight: 100,
      minWeight: 100,
      maxWeight: 250,
      step: 50,
      basePrice: 0,
      stepPrice: 0,
      freeWeight: true,
      nutritionPer100g: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    },
  });

  // Pricing calculator state for preview
  const [previewWeight, setPreviewWeight] = useState(100);

  // Load food categories and templates
  useEffect(() => {
    fetchFoodCategories();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodCategoryFilter, activeFilter]);

  const fetchFoodCategories = async () => {
    try {
      const data = await foodCategoryService.findAll();
      setFoodCategories(data);
    } catch (error) {
      console.error("Failed to fetch food categories:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await mealComponentTemplateService.findAll(
        foodCategoryFilter || undefined,
        activeFilter
      );
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      alert("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await mealComponentTemplateService.create(formData as {
        name: string;
        description?: string;
        foodCategory?: string;
        defaultConfig: ComponentDefaultConfig;
        active?: boolean;
        tags?: string[];
      });
      alert("Template created successfully!");
      setShowCreateDialog(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error("Failed to create template:", error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unknown error";
      alert(`Failed to create template: ${errorMessage}`);
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    try {
      await mealComponentTemplateService.update(selectedTemplate._id, {
        ...formData,
        defaultConfig: formData.defaultConfig as unknown as Record<string, unknown>
      });
      alert("Template updated successfully!");
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error("Failed to update template:", error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unknown error";
      alert(`Failed to update template: ${errorMessage}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    try {
      await mealComponentTemplateService.remove(selectedTemplate._id);
      alert("Template deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Unknown error";
      alert(`Failed to delete template: ${errorMessage}`);
    }
  };

  const openEditDialog = (template: MealComponentTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      foodCategory: template.foodCategory,
      active: template.active,
      tags: template.tags || [],
      defaultConfig: { ...template.defaultConfig },
    });
    setPreviewWeight(template.defaultConfig.baseWeight);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (template: MealComponentTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      foodCategory: "",
      active: true,
      tags: [],
      defaultConfig: {
        title: "",
        baseWeight: 100,
        minWeight: 100,
        maxWeight: 250,
        step: 50,
        basePrice: 0,
        stepPrice: 0,
        freeWeight: true,
        nutritionPer100g: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      },
    });
    setPreviewWeight(100);
  };

  // Calculate price for preview
  const calculatePreviewPrice = () => {
    if (!formData.defaultConfig) return 0;
    const { baseWeight, step, basePrice, stepPrice, freeWeight } =
      formData.defaultConfig;
    const weightAboveBase = Math.max(0, previewWeight - baseWeight);
    const increments = Math.floor(weightAboveBase / step);
    const firstIncrementFree = freeWeight && increments > 0 ? 1 : 0;
    const billableIncrements = Math.max(0, increments - firstIncrementFree);
    return basePrice + billableIncrements * stepPrice;
  };

  // Calculate nutrition for preview
  const calculatePreviewNutrition = () => {
    if (!formData.defaultConfig)
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const { nutritionPer100g } = formData.defaultConfig;
    const multiplier = previewWeight / 100;
    return {
      calories: Math.round(nutritionPer100g.calories * multiplier),
      protein: Math.round(nutritionPer100g.protein * multiplier * 10) / 10,
      carbs: Math.round(nutritionPer100g.carbs * multiplier * 10) / 10,
      fat: Math.round(nutritionPer100g.fat * multiplier * 10) / 10,
    };
  };

  // Filter templates by search query
  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.templateId.toLowerCase().includes(query) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  // Get food category name from ID
  const getFoodCategoryName = (foodCategoryId?: string) => {
    if (!foodCategoryId) return "None";
    const category = foodCategories.find(
      (c) => c.foodCategoryId === foodCategoryId
    );
    return category?.name_en || category?.name || foodCategoryId;
  };

  const updateDefaultConfig = (field: string, value: string | number | boolean | Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      defaultConfig: {
        ...prev.defaultConfig!,
        [field]: value,
      },
    }));
  };

  const updateNutrition = (field: keyof NutritionPer100g, value: number) => {
    setFormData((prev) => ({
      ...prev,
      defaultConfig: {
        ...prev.defaultConfig!,
        nutritionPer100g: {
          ...prev.defaultConfig!.nutritionPer100g,
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Meal Component Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage reusable meal component templates
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Food Category
            </label>
            <select
              value={foodCategoryFilter}
              onChange={(e) => setFoodCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Food Categories</option>
              {foodCategories
                .filter((cat) => cat.active)
                .map((cat) => (
                  <option key={cat._id} value={cat.foodCategoryId}>
                    {cat.name || cat.name_en} ({cat.foodCategoryId})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={activeFilter === undefined ? "" : activeFilter.toString()}
              onChange={(e) =>
                setActiveFilter(
                  e.target.value === "" ? undefined : e.target.value === "true"
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No templates found. Create your first template to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {template.templateId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {template.defaultConfig.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getFoodCategoryName(template.foodCategory)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        Base: AED {template.defaultConfig.basePrice.toFixed(2)}
                      </div>
                      <div>
                        Step: +AED {template.defaultConfig.stepPrice.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {template.usageCount} product
                        {template.usageCount !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          template.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {template.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditDialog(template)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteDialog(template)}
                        className="text-red-600 hover:text-red-900"
                        disabled={template.usageCount > 0}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {(showCreateDialog || showEditDialog) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {showCreateDialog ? "Create Template" : "Edit Template"}
              </h2>
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setShowEditDialog(false);
                  setSelectedTemplate(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Standard Chicken Breast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Food Category (Optional)
                    </label>
                    <select
                      value={formData.foodCategory || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          foodCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Generic Template)</option>
                      {foodCategories
                        .filter((cat) => cat.active)
                        .map((cat) => (
                          <option key={cat._id} value={cat.foodCategoryId}>
                            {cat.name || cat.name_en} ({cat.foodCategoryId})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Link this template to a specific meal time (e.g.,
                      Breakfast, Lunch)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description for this template"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>

              {/* Component Configuration */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Component Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Component Title *
                    </label>
                    <input
                      type="text"
                      value={formData.defaultConfig?.title}
                      onChange={(e) =>
                        updateDefaultConfig("title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Chicken Breast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ingredient Type
                    </label>
                    <select
                      value={formData.defaultConfig?.ingredientType || ""}
                      onChange={(e) =>
                        updateDefaultConfig("ingredientType", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type...</option>
                      {INGREDIENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Weight Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Weight Settings (grams)
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Weight *
                    </label>
                    <input
                      type="number"
                      value={formData.defaultConfig?.baseWeight}
                      onChange={(e) =>
                        updateDefaultConfig(
                          "baseWeight",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Weight *
                    </label>
                    <input
                      type="number"
                      value={formData.defaultConfig?.minWeight}
                      onChange={(e) =>
                        updateDefaultConfig(
                          "minWeight",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Weight *
                    </label>
                    <input
                      type="number"
                      value={formData.defaultConfig?.maxWeight}
                      onChange={(e) =>
                        updateDefaultConfig(
                          "maxWeight",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step *
                    </label>
                    <input
                      type="number"
                      value={formData.defaultConfig?.step}
                      onChange={(e) =>
                        updateDefaultConfig(
                          "step",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Pricing (AED)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.defaultConfig?.basePrice}
                      onChange={(e) =>
                        updateDefaultConfig(
                          "basePrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.defaultConfig?.stepPrice}
                      onChange={(e) =>
                        updateDefaultConfig(
                          "stepPrice",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      type="checkbox"
                      checked={formData.defaultConfig?.freeWeight}
                      onChange={(e) =>
                        updateDefaultConfig("freeWeight", e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      First Increment Free
                    </label>
                  </div>
                </div>
              </div>

              {/* Nutrition per 100g */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Nutrition per 100g
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Calories *
                    </label>
                    <input
                      type="number"
                      value={formData.defaultConfig?.nutritionPer100g.calories}
                      onChange={(e) =>
                        updateNutrition(
                          "calories",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Protein (g) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultConfig?.nutritionPer100g.protein}
                      onChange={(e) =>
                        updateNutrition(
                          "protein",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Carbs (g) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultConfig?.nutritionPer100g.carbs}
                      onChange={(e) =>
                        updateNutrition(
                          "carbs",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fat (g) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultConfig?.nutritionPer100g.fat}
                      onChange={(e) =>
                        updateNutrition("fat", parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fiber (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={
                        formData.defaultConfig?.nutritionPer100g.fiber || ""
                      }
                      onChange={(e) =>
                        updateNutrition(
                          "fiber",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sugar (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={
                        formData.defaultConfig?.nutritionPer100g.sugar || ""
                      }
                      onChange={(e) =>
                        updateNutrition(
                          "sugar",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sodium (mg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={
                        formData.defaultConfig?.nutritionPer100g.sodium || ""
                      }
                      onChange={(e) =>
                        updateNutrition(
                          "sodium",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculator Preview */}
              <div className="space-y-4 border-t pt-4 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  Price & Nutrition Preview
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview Weight: {previewWeight}g
                  </label>
                  <input
                    type="range"
                    min={formData.defaultConfig?.minWeight || 100}
                    max={formData.defaultConfig?.maxWeight || 250}
                    step={formData.defaultConfig?.step || 50}
                    value={previewWeight}
                    onChange={(e) => setPreviewWeight(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600 mb-1">Total Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      AED {calculatePreviewPrice().toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600 mb-1">Nutrition</p>
                    <div className="text-xs space-y-1">
                      <div>
                        <strong>{calculatePreviewNutrition().calories}</strong>{" "}
                        cal
                      </div>
                      <div>
                        P:{" "}
                        <strong>{calculatePreviewNutrition().protein}g</strong>{" "}
                        | C:{" "}
                        <strong>{calculatePreviewNutrition().carbs}g</strong> |
                        F: <strong>{calculatePreviewNutrition().fat}g</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setShowEditDialog(false);
                  setSelectedTemplate(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={showCreateDialog ? handleCreate : handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {showCreateDialog ? "Create Template" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the template &quot;
              {selectedTemplate.name}&quot;?
              {selectedTemplate.usageCount > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This template is currently used by{" "}
                  {selectedTemplate.usageCount} product(s) and cannot be
                  deleted.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedTemplate.usageCount > 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
