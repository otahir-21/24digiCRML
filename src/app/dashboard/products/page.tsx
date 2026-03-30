"use client";

import { useState, useEffect } from "react";
import {
  productService,
  productCategoryService,
  foodCategoryService,
  productAddOnService,
  mealComponentTemplateService,
} from "@/lib/api-client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { formatPrice, getCurrencyLabel } from "@/utils/currency";
import { ApiError } from "@/types/api";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocalProduct {
  _id: string;
  productId: string;
  name: string;
  name_en: string;
  name_ar?: string;
  description?: string;
  description_en?: string;
  description_ar?: string;
  price: number;
  productCategory: string;
  foodCategory?: string;
  active: boolean;
  image?: string;
  components?: MealComponent[];
  hasCustomizableComponents?: boolean;
  basePrice?: number;
  hasAddOns?: boolean;
  allowedAddOns?: string[];
  addOnPrices?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface AddOn {
  _id: string;
  addOnId: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  available: boolean;
  active: boolean;
}

interface Category {
  _id: string;
  name: string;
  name_en?: string;
  name_ar?: string;
  active: boolean;
  productCategoryId?: string;
  foodCategoryId?: string;
}

interface MealComponent {
  id: string;
  title: string;
  ingredientType: string;
  baseWeight: number;
  minWeight: number;
  maxWeight: number;
  step: number; // Increment size in grams (e.g., 50g)
  basePrice: number; // Price for the base weight
  stepPrice: number; // Price per increment step
  freeWeight: boolean; // Zero-cost first increment flag
  pricePerHundredGrams?: number; // Legacy field, deprecated (use basePrice/stepPrice)
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface MealComponentTemplate {
  _id: string;
  templateId: string;
  name: string;
  category: string;
  defaultConfig: {
    title: string;
    baseWeight: number;
    minWeight: number;
    maxWeight: number;
    step: number;
    basePrice: number;
    stepPrice: number;
    freeWeight: boolean;
    nutritionPer100g: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    ingredientType?: string;
  };
  active: boolean;
  usageCount: number;
}

interface ProductComponentMapping {
  templateId?: string;
  isCustom: boolean;
  overrides?: Partial<Omit<MealComponent, 'id'>>;
  customComponent?: MealComponent;
  displayOrder: number;
  // UI state
  _useTemplate?: boolean;
  _selectedTemplateId?: string;
}

const getSafeImageSrc = (value?: string): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  const normalized = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;

  try {
    const url = new URL(normalized);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "data:") {
      return url.toString();
    }
    return null;
  } catch {
    // If the URL is a relative path like "uploads/abc.jpg", try prefixing with a leading slash.
    if (/^[\w./-]+$/.test(trimmed)) {
      return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    }
    return null;
  }
};

function ProductImageCell({
  image,
  name,
}: {
  image?: string;
  name: string;
}) {
  const [hasError, setHasError] = useState(false);
  const safeSrc = getSafeImageSrc(image);

  if (!safeSrc || hasError) {
    return <span className="text-gray-400">No image</span>;
  }

  return (
    <Image
      src={safeSrc}
      alt={name}
      width={40}
      height={40}
      className="w-10 h-10 object-cover rounded"
      onError={() => setHasError(true)}
      unoptimized={safeSrc.startsWith("data:")}
    />
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [foodCategories, setFoodCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LocalProduct | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterFoodCategory, setFilterFoodCategory] = useState<string>("all");
  const [allAddOns, setAllAddOns] = useState<AddOn[]>([]);
  const [allTemplates, setAllTemplates] = useState<MealComponentTemplate[]>([]);
  const [formData, setFormData] = useState({
    name_en: "",
    name_ar: "",
    description_en: "",
    description_ar: "",
    price: 0,
    productCategory: "",
    foodCategory: "none",
    active: true,
    image: "",
    hasCustomizableComponents: false,
    basePrice: 0,
    components: [] as MealComponent[],
    componentMappings: [] as ProductComponentMapping[],
    hasAddOns: false,
    allowedAddOns: [] as string[],
    addOnPrices: {} as Record<string, number>,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, filterCategory, filterFoodCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, productCatsRes, foodCatsRes, addOnsRes, templatesRes] =
        await Promise.all([
          productService.findAll(),
          productCategoryService.findAll(),
          foodCategoryService.findAll(),
          productAddOnService.findAll(),
          mealComponentTemplateService.findAll(undefined, true), // Only active templates
        ]);

      setProducts(productsRes.data || productsRes);

      // Filter out categories without valid IDs or names
      const validProductCats = (productCatsRes.data || productCatsRes).filter(
        (cat: Category) => cat && (cat.productCategoryId || cat.name || cat._id)
      );
      setProductCategories(validProductCats);

      const validFoodCats = (foodCatsRes.data || foodCatsRes).filter(
        (cat: Category) => cat && (cat.foodCategoryId || cat.name || cat._id)
      );
      setFoodCategories(validFoodCats);

      // Set add-ons filtering only active ones
      const activeAddOns = (addOnsRes.data || addOnsRes).filter(
        (addon: AddOn) => addon.active && addon.available
      );
      setAllAddOns(activeAddOns);

      // Set templates
      setAllTemplates(templatesRes.data || templatesRes || []);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description: apiError.response?.data?.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (filterCategory !== "all") {
      filtered = filtered.filter((p) => p.productCategory === filterCategory);
    }

    if (filterFoodCategory !== "all") {
      filtered = filtered.filter((p) => p.foodCategory === filterFoodCategory);
    }

    setFilteredProducts(filtered);
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

    // Validate components if customizable
    if (formData.hasCustomizableComponents && formData.components.length > 0) {
      for (let i = 0; i < formData.components.length; i++) {
        const component = formData.components[i];
        const weightError = validateWeightBounds(component);
        const stepError = validateStep(component.step);

        if (weightError) {
          toast({
            title: "Validation Error",
            description: `Component ${i + 1}: ${weightError}`,
            variant: "destructive",
          });
          return;
        }

        if (stepError) {
          toast({
            title: "Validation Error",
            description: `Component ${i + 1}: ${stepError}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const englishName = formData.name_en.trim();
    const arabicName = formData.name_ar.trim();
    const englishDescription = formData.description_en.trim();
    const arabicDescription = formData.description_ar.trim();

    try {
      const payload: Record<string, unknown> = {
        name_en: englishName,
        name_ar: arabicName || undefined,
        description_en: englishDescription || undefined,
        description_ar: arabicDescription || undefined,
        name: englishName,
        description: englishDescription || undefined,
        price: Number(formData.price),
        productCategory: formData.productCategory,
        foodCategory:
          formData.foodCategory && formData.foodCategory !== "none"
            ? formData.foodCategory
            : undefined,
        active: formData.active,
        image: formData.image || undefined,
        hasCustomizableComponents: formData.hasCustomizableComponents,
        hasAddOns: formData.hasAddOns,
      };

      if (formData.hasCustomizableComponents) {
        payload.basePrice = Number(formData.basePrice);

        // Send componentMappings to API
        payload.componentMappings = formData.componentMappings.map((mapping, index) => {
          if (mapping.isCustom && mapping.customComponent) {
            return {
              isCustom: true,
              customComponent: mapping.customComponent,
              displayOrder: index,
            };
          } else {
            return {
              templateId: mapping.templateId,
              isCustom: false,
              overrides: mapping.overrides && Object.keys(mapping.overrides).length > 0
                ? mapping.overrides
                : undefined,
              displayOrder: index,
            };
          }
        });

        // Debug: Log component mappings payload
        console.log('📦 Creating product with component mappings:', JSON.stringify(payload.componentMappings, null, 2));
        console.log('🔍 Mappings breakdown:');
        formData.componentMappings.forEach((mapping, idx) => {
          console.log(`  Mapping ${idx + 1}: ${mapping.isCustom ? 'Custom' : `Template ${mapping.templateId}`}`);
          if (mapping.overrides && Object.keys(mapping.overrides).length > 0) {
            console.log(`    Overrides: ${Object.keys(mapping.overrides).join(', ')}`);
          }
        });
      }

      if (formData.hasAddOns) {
        payload.allowedAddOns = formData.allowedAddOns;
        if (Object.keys(formData.addOnPrices).length > 0) {
          payload.addOnPrices = formData.addOnPrices;
        }
      }

      await productService.create(payload as {
        name_en: string;
        name_ar?: string;
        description_en?: string;
        description_ar?: string;
        name?: string;
        productCategory: string;
        foodCategory?: string;
        price: number;
        available?: boolean;
        hasOptions?: boolean;
        hasIngredients?: boolean;
        active?: boolean;
        sortOrder?: number;
        minOrderQuantity?: number;
        maxOrderQuantity?: number;
        preparationTime?: number;
        image?: string;
        allergens?: string[];
        nutritionInfo?: Record<string, unknown>;
        addOns?: string[];
        addOnPrices?: Record<string, number>;
        hasCustomizableComponents?: boolean;
        components?: Record<string, unknown>[];
        basePrice?: number;
        allowedAddOns?: string[];
        componentMappings?: Record<string, unknown>[];
        hasAddOns?: boolean;
      });
      const componentCount = formData.hasCustomizableComponents ? formData.components.length : 0;
      toast({
        title: "Success",
        description: componentCount > 0
          ? `Product created successfully with ${componentCount} component${componentCount > 1 ? 's' : ''}`
          : "Product created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to create product",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;

    if (!formData.name_en.trim()) {
      toast({
        title: "Missing name",
        description: "Provide at least the English name before saving.",
        variant: "destructive",
      });
      return;
    }

    // Validate components if customizable
    if (formData.hasCustomizableComponents && formData.components.length > 0) {
      for (let i = 0; i < formData.components.length; i++) {
        const component = formData.components[i];
        const weightError = validateWeightBounds(component);
        const stepError = validateStep(component.step);

        if (weightError) {
          toast({
            title: "Validation Error",
            description: `Component ${i + 1}: ${weightError}`,
            variant: "destructive",
          });
          return;
        }

        if (stepError) {
          toast({
            title: "Validation Error",
            description: `Component ${i + 1}: ${stepError}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const englishName = formData.name_en.trim();
    const arabicName = formData.name_ar.trim();
    const englishDescription = formData.description_en.trim();
    const arabicDescription = formData.description_ar.trim();

    try {
      const payload: Record<string, unknown> = {
        name_en: englishName,
        name_ar: arabicName || undefined,
        description_en: englishDescription || undefined,
        description_ar: arabicDescription || undefined,
        name: englishName,
        description: englishDescription || undefined,
        price: Number(formData.price),
        productCategory: formData.productCategory,
        foodCategory:
          formData.foodCategory && formData.foodCategory !== "none"
            ? formData.foodCategory
            : undefined,
        active: formData.active,
        image: formData.image || undefined,
        hasCustomizableComponents: formData.hasCustomizableComponents,
        hasAddOns: formData.hasAddOns,
      };

      if (formData.hasCustomizableComponents) {
        payload.basePrice = Number(formData.basePrice);

        // Send componentMappings to API
        payload.componentMappings = formData.componentMappings.map((mapping, index) => {
          if (mapping.isCustom && mapping.customComponent) {
            return {
              isCustom: true,
              customComponent: mapping.customComponent,
              displayOrder: index,
            };
          } else {
            return {
              templateId: mapping.templateId,
              isCustom: false,
              overrides: mapping.overrides && Object.keys(mapping.overrides).length > 0
                ? mapping.overrides
                : undefined,
              displayOrder: index,
            };
          }
        });

        // Debug: Log component mappings payload
        console.log('✏️ Updating product with component mappings:', JSON.stringify(payload.componentMappings, null, 2));
        console.log('🔍 Mappings breakdown:');
        formData.componentMappings.forEach((mapping, idx) => {
          console.log(`  Mapping ${idx + 1}: ${mapping.isCustom ? 'Custom' : `Template ${mapping.templateId}`}`);
          if (mapping.overrides && Object.keys(mapping.overrides).length > 0) {
            console.log(`    Overrides: ${Object.keys(mapping.overrides).join(', ')}`);
          }
        });
      }

      if (formData.hasAddOns) {
        payload.allowedAddOns = formData.allowedAddOns;
        if (Object.keys(formData.addOnPrices).length > 0) {
          payload.addOnPrices = formData.addOnPrices;
        }
      }

      await productService.update(selectedProduct._id, payload);
      const componentCount = formData.hasCustomizableComponents ? formData.components.length : 0;
      toast({
        title: "Success",
        description: componentCount > 0
          ? `Product updated successfully with ${componentCount} component${componentCount > 1 ? 's' : ''}`
          : "Product updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await productService.remove(selectedProduct._id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast({
        title: "Error",
        description:
          apiError.response?.data?.message || "Failed to delete product",
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
      price: 0,
      productCategory: "",
      foodCategory: "none",
      active: true,
      image: "",
      hasCustomizableComponents: false,
      basePrice: 0,
      components: [],
      componentMappings: [],
      hasAddOns: false,
      allowedAddOns: [],
      addOnPrices: {},
    });
    setSelectedProduct(null);
  };

  // Component normalization utility - ensures all fields exist with defaults
  const normalizeComponent = (component: Partial<MealComponent>): MealComponent => {
    const baseWeight = component.baseWeight || 200;
    const step = component.step || 50;
    const pricePerHundredGrams = component.pricePerHundredGrams || 0;

    // Auto-calculate pricing from pricePerHundredGrams if new fields are missing
    // This helps migrate legacy products with sensible defaults
    let basePrice = component.basePrice;
    let stepPrice = component.stepPrice;

    if ((!basePrice || basePrice === 0) && pricePerHundredGrams > 0) {
      // Calculate base price: (price per 100g / 100) * base weight
      basePrice = (pricePerHundredGrams / 100) * baseWeight;
    } else {
      basePrice = basePrice || 0;
    }

    if ((!stepPrice || stepPrice === 0) && pricePerHundredGrams > 0) {
      // Calculate step price: (price per 100g / 100) * step size
      stepPrice = (pricePerHundredGrams / 100) * step;
    } else {
      stepPrice = stepPrice || 0;
    }

    // Handle freeWeight boolean conversion (handles both boolean and string values from backend)
    const freeWeight = component.freeWeight === true || (component.freeWeight as unknown) === "true";

    return {
      id: component.id || `component_${Date.now()}`,
      title: component.title || "",
      ingredientType: component.ingredientType || "protein",
      baseWeight,
      minWeight: component.minWeight || 100,
      maxWeight: component.maxWeight || 500,
      step,
      basePrice,
      stepPrice,
      freeWeight,
      pricePerHundredGrams,
      nutritionPer100g: component.nutritionPer100g || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    };
  };

  // Validation and calculation utilities
  const validateWeightBounds = (component: MealComponent): string | null => {
    if (component.minWeight < 100 || component.minWeight > 250) {
      return "Minimum weight must be between 100g and 250g";
    }
    if (component.maxWeight < 100 || component.maxWeight > 250) {
      return "Maximum weight must be between 100g and 250g";
    }
    if (component.minWeight > component.maxWeight) {
      return "Minimum weight cannot exceed maximum weight";
    }
    return null;
  };

  const validateStep = (step: number): string | null => {
    if (step !== 50) {
      return "Step size must be 50g";
    }
    return null;
  };

  const calculateTotalPrice = (component: MealComponent, selectedWeight: number): number => {
    // Price formula: basePrice + (increments × stepPrice) - (freeWeight ? stepPrice : 0)
    const weightDifference = selectedWeight - component.baseWeight;
    if (weightDifference <= 0) {
      return component.basePrice;
    }

    const increments = Math.floor(weightDifference / component.step);
    let totalPrice = component.basePrice + (increments * component.stepPrice);

    // Apply free first increment if enabled
    if (component.freeWeight && increments > 0) {
      totalPrice -= component.stepPrice;
    }

    return totalPrice;
  };

  const calculateNutrition = (component: MealComponent, selectedWeight: number) => {
    // Nutrition formula: (nutritionPer100g × totalWeight) / 100
    const scaleFactor = selectedWeight / 100;
    return {
      calories: Math.round(component.nutritionPer100g.calories * scaleFactor),
      protein: Math.round(component.nutritionPer100g.protein * scaleFactor * 10) / 10,
      carbs: Math.round(component.nutritionPer100g.carbs * scaleFactor * 10) / 10,
      fat: Math.round(component.nutritionPer100g.fat * scaleFactor * 10) / 10,
    };
  };

  // Component management functions
  const addComponent = () => {
    const newMapping: ProductComponentMapping = {
      templateId: undefined,
      isCustom: true,
      displayOrder: formData.componentMappings.length,
      _useTemplate: false,
      _selectedTemplateId: undefined,
      customComponent: {
        id: `component_${Date.now()}`,
        title: "",
        ingredientType: "protein",
        baseWeight: 200,
        minWeight: 100,
        maxWeight: 500,
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
      overrides: {},
    };

    setFormData({
      ...formData,
      componentMappings: [...formData.componentMappings, newMapping],
      components: [...formData.components, newMapping.customComponent!], // Keep for backward compat
    });
  };

  const updateComponent = (
    index: number,
    field: string,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    const updatedMappings = [...formData.componentMappings];
    const mapping = updatedMappings[index];

    if (field === '_useTemplate') {
      // Toggle between template and custom mode
      mapping._useTemplate = Boolean(value);
      if (value && mapping._selectedTemplateId) {
        const template = allTemplates.find(t => t._id === mapping._selectedTemplateId);
        if (template) {
          mapping.templateId = template.templateId;
          mapping.isCustom = false;
          mapping.customComponent = undefined;
        }
      } else {
        // Switch to custom mode - create from current values or template defaults
        mapping.isCustom = true;
        mapping.templateId = undefined;
        if (!mapping.customComponent) {
          const template = allTemplates.find(t => t._id === mapping._selectedTemplateId);
          if (template) {
            mapping.customComponent = {
              id: `component_${Date.now()}`,
              title: template.defaultConfig.title,
              ingredientType: template.defaultConfig.ingredientType || 'protein',
              baseWeight: template.defaultConfig.baseWeight,
              minWeight: template.defaultConfig.minWeight,
              maxWeight: template.defaultConfig.maxWeight,
              step: template.defaultConfig.step,
              basePrice: template.defaultConfig.basePrice,
              stepPrice: template.defaultConfig.stepPrice,
              freeWeight: template.defaultConfig.freeWeight,
              nutritionPer100g: {...template.defaultConfig.nutritionPer100g},
            };
          }
        }
      }
    } else if (field === '_selectedTemplateId') {
      // Template selected from dropdown
      mapping._selectedTemplateId = String(value);
      const template = allTemplates.find(t => t._id === String(value));
      if (template) {
        mapping.templateId = template.templateId;
        mapping.isCustom = false;
        mapping.overrides = {};

        // Auto-populate component fields with template's defaultConfig
        const updatedComponents = [...formData.components];
        updatedComponents[index] = {
          id: template.templateId,
          title: template.defaultConfig.title,
          ingredientType: template.defaultConfig.ingredientType || 'protein',
          baseWeight: template.defaultConfig.baseWeight,
          minWeight: template.defaultConfig.minWeight,
          maxWeight: template.defaultConfig.maxWeight,
          step: template.defaultConfig.step,
          basePrice: template.defaultConfig.basePrice,
          stepPrice: template.defaultConfig.stepPrice,
          freeWeight: template.defaultConfig.freeWeight,
          nutritionPer100g: {
            calories: template.defaultConfig.nutritionPer100g.calories,
            protein: template.defaultConfig.nutritionPer100g.protein,
            carbs: template.defaultConfig.nutritionPer100g.carbs,
            fat: template.defaultConfig.nutritionPer100g.fat,
          },
        };

        // Update formData immediately with populated component
        setFormData({
          ...formData,
          componentMappings: updatedMappings,
          components: updatedComponents,
        });
        return; // Exit early since we're already setting state
      }
    } else if (field.startsWith('override_')) {
      // Override a template field
      const fieldName = field.replace('override_', '');
      if (!mapping.overrides) mapping.overrides = {};

      if (fieldName.includes('.')) {
        const [parent, child] = fieldName.split('.');
        const overridesRecord = mapping.overrides as Record<string, unknown>;
        if (!overridesRecord[parent]) overridesRecord[parent] = {};
        (overridesRecord[parent] as Record<string, unknown>)[child] = value;
      } else {
        (mapping.overrides as Record<string, unknown>)[fieldName] = value;
      }
    } else if (mapping.isCustom && mapping.customComponent) {
      // Update custom component
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'nutritionPer100g') {
          mapping.customComponent.nutritionPer100g[child as keyof typeof mapping.customComponent.nutritionPer100g] = value as number;
        }
      } else {
        (mapping.customComponent as unknown as Record<string, unknown>)[field] = value;
      }
    }

    // Update the components array for backward compatibility
    const updatedComponents = updatedMappings.map(m => {
      if (m.isCustom && m.customComponent) {
        return m.customComponent;
      } else if (m.templateId) {
        const template = allTemplates.find(t => t.templateId === m.templateId);
        if (template) {
          return {
            id: template.templateId,
            title: m.overrides?.title || template.defaultConfig.title,
            ingredientType: m.overrides?.ingredientType || template.defaultConfig.ingredientType || 'protein',
            baseWeight: m.overrides?.baseWeight || template.defaultConfig.baseWeight,
            minWeight: m.overrides?.minWeight || template.defaultConfig.minWeight,
            maxWeight: m.overrides?.maxWeight || template.defaultConfig.maxWeight,
            step: m.overrides?.step || template.defaultConfig.step,
            basePrice: m.overrides?.basePrice || template.defaultConfig.basePrice,
            stepPrice: m.overrides?.stepPrice || template.defaultConfig.stepPrice,
            freeWeight: m.overrides?.freeWeight !== undefined ? m.overrides.freeWeight : template.defaultConfig.freeWeight,
            nutritionPer100g: {
              calories: m.overrides?.nutritionPer100g?.calories || template.defaultConfig.nutritionPer100g.calories,
              protein: m.overrides?.nutritionPer100g?.protein || template.defaultConfig.nutritionPer100g.protein,
              carbs: m.overrides?.nutritionPer100g?.carbs || template.defaultConfig.nutritionPer100g.carbs,
              fat: m.overrides?.nutritionPer100g?.fat || template.defaultConfig.nutritionPer100g.fat,
            },
          };
        }
      }
      return null;
    }).filter(Boolean) as MealComponent[];

    setFormData({
      ...formData,
      componentMappings: updatedMappings,
      components: updatedComponents,
    });
  };

  const removeComponent = (index: number) => {
    const updatedMappings = formData.componentMappings.filter((_, i) => i !== index);
    // Update displayOrder
    updatedMappings.forEach((mapping, idx) => {
      mapping.displayOrder = idx;
    });

    // Update components for backward compatibility
    const updatedComponents = formData.components.filter((_, i) => i !== index);

    setFormData({
      ...formData,
      componentMappings: updatedMappings,
      components: updatedComponents,
    });
  };

  // Add-on management functions
  const toggleAddOn = (addOnId: string) => {
    const currentAddOns = [...formData.allowedAddOns];
    const currentPrices = { ...formData.addOnPrices };

    if (currentAddOns.includes(addOnId)) {
      // Remove add-on
      const index = currentAddOns.indexOf(addOnId);
      currentAddOns.splice(index, 1);
      delete currentPrices[addOnId];
    } else {
      // Add add-on with base price
      currentAddOns.push(addOnId);
      const addOn = allAddOns.find((a) => a.addOnId === addOnId);
      if (addOn) {
        currentPrices[addOnId] = addOn.price;
      }
    }

    setFormData({
      ...formData,
      allowedAddOns: currentAddOns,
      addOnPrices: currentPrices,
    });
  };

  const updateAddOnPrice = (addOnId: string, price: number) => {
    setFormData({
      ...formData,
      addOnPrices: {
        ...formData.addOnPrices,
        [addOnId]: price,
      },
    });
  };

  const openEditDialog = (product: LocalProduct) => {
    setSelectedProduct(product);

    // Debug: Log raw component data from backend
    console.log('🔍 Raw component data from backend:', JSON.stringify(product.components, null, 2));

    // Normalize components to ensure all new fields exist with defaults
    const normalizedComponents = (product.components || []).map(component =>
      normalizeComponent(component as Partial<MealComponent>)
    );

    // Convert existing components to componentMappings
    const mappings: ProductComponentMapping[] = normalizedComponents.map((comp, index) => ({
      templateId: undefined,
      isCustom: true,
      displayOrder: index,
      _useTemplate: false,
      _selectedTemplateId: undefined,
      customComponent: comp,
      overrides: {},
    }));

    // Debug: Log normalized components to verify freeWeight is correctly converted
    console.log('✅ Normalized components:', JSON.stringify(normalizedComponents, null, 2));
    console.log('✅ Component mappings:', JSON.stringify(mappings, null, 2));
    normalizedComponents.forEach((comp, idx) => {
      console.log(`  Component ${idx + 1} freeWeight: ${comp.freeWeight} (type: ${typeof comp.freeWeight})`);
    });

    setFormData({
      name_en: product.name_en || product.name || "",
      name_ar: product.name_ar || "",
      description_en: product.description_en || product.description || "",
      description_ar: product.description_ar || "",
      price: product.price,
      productCategory: product.productCategory,
      foodCategory: product.foodCategory || "none",
      active: product.active,
      image: product.image || "",
      hasCustomizableComponents: product.hasCustomizableComponents || false,
      basePrice: product.basePrice || 0,
      components: normalizedComponents,
      componentMappings: mappings,
      hasAddOns: product.hasAddOns || false,
      allowedAddOns: product.allowedAddOns || [],
      addOnPrices: product.addOnPrices || {},
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: LocalProduct) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const columns = [
    {
      key: "productId",
      header: "ID",
      sortable: true,
    },
    {
      key: "name_en",
      header: "Name (EN)",
      sortable: true,
      render: (product: LocalProduct) => product.name_en || product.name,
    },
    {
      key: "name_ar",
      header: "Name (AR)",
      render: (product: LocalProduct) =>
        product.name_ar || (
          <span className="text-gray-400">Not provided</span>
        ),
    },
    {
      key: "image",
      header: "Image",
      render: (product: LocalProduct) => (
        <ProductImageCell
          image={product.image}
          name={product.name_en || product.name}
        />
      ),
    },
    {
      key: "price",
      header: "Price",
      render: (product: LocalProduct) => formatPrice(product.price),
      sortable: true,
    },
    {
      key: "productCategory",
      header: "Category",
      render: (product: LocalProduct) => {
        const category = productCategories.find(
          (c) =>
            c.productCategoryId === product.productCategory ||
            c.name === product.productCategory
        );
        return (
          category?.name_en || category?.name || product.productCategory
        );
      },
    },
    {
      key: "foodCategory",
      header: "Food Category",
      render: (product: LocalProduct) => {
        if (!product.foodCategory)
          return <span className="text-gray-400">-</span>;
        const category = foodCategories.find(
          (c) =>
            c.foodCategoryId === product.foodCategory ||
            c.name === product.foodCategory
        );
        return category?.name_en || category?.name || product.foodCategory;
      },
    },
    {
      key: "active",
      header: "Status",
      render: (product: LocalProduct) => (
        <Badge variant={product.active ? "default" : "secondary"}>
          {product.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "hasCustomizableComponents",
      header: "Customizable",
      render: (product: LocalProduct) =>
        product.hasCustomizableComponents ? (
          <Badge variant="outline">Yes</Badge>
        ) : (
          <span className="text-gray-400">No</span>
        ),
    },
  ];

  const actions = (product: LocalProduct) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => openEditDialog(product)}
      >
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => openDeleteDialog(product)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="filter-category">Filter by Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {productCategories.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat.productCategoryId || cat.name || cat._id}
                    >
                      {cat.name_en || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="filter-food-category">
                Filter by Food Category
              </Label>
              <Select
                value={filterFoodCategory}
                onValueChange={setFilterFoodCategory}
              >
                <SelectTrigger id="filter-food-category">
                  <SelectValue placeholder="All Food Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Food Categories</SelectItem>
                  {foodCategories.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat.foodCategoryId || cat.name || cat._id}
                    >
                      {cat.name_en || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : (
            <DataTable<LocalProduct>
              data={filteredProducts}
              columns={columns}
              actions={actions}
              searchPlaceholder="Search products..."
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>
              Add a new product to your catalog.
            </DialogDescription>
          </DialogHeader>
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
                      onChange={(e) =>
                        setFormData({ ...formData, name_en: e.target.value })
                      }
                      placeholder="e.g., Falafel Bowl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_en">Description (English)</Label>
                    <Textarea
                      id="description_en"
                      value={formData.description_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_en: e.target.value,
                        })
                      }
                      placeholder="Optional details for English readers"
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
                      placeholder="مثال: طبق فلافل"
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
                      placeholder="تفاصيل اختيارية باللغة العربية"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <Label htmlFor="price">{getCurrencyLabel()}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="basePrice">
                Base {getCurrencyLabel()} (if customizable)
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basePrice: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
                disabled={!formData.hasCustomizableComponents}
              />
            </div>
            <div>
              <Label htmlFor="productCategory">Product Category</Label>
              <Select
                value={formData.productCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, productCategory: value })
                }
              >
                <SelectTrigger id="productCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat.productCategoryId || cat._id}
                    >
                      {cat.name_en || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="foodCategory">Food Category (Optional)</Label>
              <Select
                value={formData.foodCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, foodCategory: value })
                }
              >
                <SelectTrigger id="foodCategory">
                  <SelectValue placeholder="Select food category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {foodCategories.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat.foodCategoryId || cat._id}
                    >
                      {cat.name_en || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                uploadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/v1/product/upload-image`}
                label="Product Image"
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasCustomizableComponents"
                checked={formData.hasCustomizableComponents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasCustomizableComponents: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="hasCustomizableComponents">
                Has Customizable Components
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasAddOns"
                checked={formData.hasAddOns}
                onChange={(e) =>
                  setFormData({ ...formData, hasAddOns: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="hasAddOns">Has Add-Ons</Label>
            </div>
          </div>

          {/* Add-Ons Selector */}
          {formData.hasAddOns && (
            <div className="col-span-2 space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Product Add-Ons</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>
                    Available Add-Ons (Check to enable for this product)
                  </Label>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {allAddOns.map((addOn) => (
                      <div
                        key={addOn.addOnId}
                        className="border rounded p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`addon-${addOn.addOnId}`}
                              checked={formData.allowedAddOns.includes(
                                addOn.addOnId
                              )}
                              onChange={() => toggleAddOn(addOn.addOnId)}
                              className="rounded"
                            />
                            <Label
                              htmlFor={`addon-${addOn.addOnId}`}
                              className="font-medium"
                            >
                              {addOn.name}
                            </Label>
                            <Badge variant="outline">{addOn.category}</Badge>
                          </div>
                        </div>

                        {formData.allowedAddOns.includes(addOn.addOnId) && (
                          <div className="ml-6 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm text-gray-600">
                                Base Price: {formatPrice(addOn.price)}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label
                                htmlFor={`price-${addOn.addOnId}`}
                                className="text-sm"
                              >
                                Custom Price:
                              </Label>
                              <Input
                                id={`price-${addOn.addOnId}`}
                                type="number"
                                step="0.01"
                                value={
                                  formData.addOnPrices[addOn.addOnId] ||
                                  addOn.price
                                }
                                onChange={(e) =>
                                  updateAddOnPrice(
                                    addOn.addOnId,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {allAddOns.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No add-ons available. Please create add-ons first.
                      </p>
                    )}
                  </div>
                </div>

                {formData.allowedAddOns.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">
                      Selected Add-Ons: {formData.allowedAddOns.length}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Custom prices will override the base add-on price for this
                      product only.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meal Components Editor */}
          {formData.hasCustomizableComponents && (
            <div className="col-span-2 space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Meal Components</h3>
                <Button type="button" size="sm" onClick={addComponent}>
                  + Add Component
                </Button>
              </div>

              {formData.components.map((component, index) => {
                const mapping = formData.componentMappings[index];
                const isTemplateMode = mapping?._useTemplate || false;
                const selectedTemplate = isTemplateMode && mapping._selectedTemplateId
                  ? allTemplates.find(t => t._id === mapping._selectedTemplateId)
                  : null;
                const overrides = mapping?.overrides || {};

                // Group templates by ingredient type
                const templatesByCategory = allTemplates.reduce((acc, template) => {
                  const category = template.defaultConfig?.ingredientType || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(template);
                  return acc;
                }, {} as Record<string, typeof allTemplates>);

                return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Component {index + 1}</h4>
                      {isTemplateMode ? (
                        <Badge variant="default" className="bg-blue-500">Template</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                      {selectedTemplate && (
                        <span className="text-xs text-gray-500">({selectedTemplate.name})</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeComponent(index)}
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Template Mode Toggle */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border">
                    <Checkbox
                      id={`use-template-${index}`}
                      checked={isTemplateMode}
                      onCheckedChange={(checked) =>
                        updateComponent(index, "_useTemplate", checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`use-template-${index}`}
                        className="font-medium cursor-pointer"
                      >
                        Use Template
                      </Label>
                      <p className="text-xs text-gray-500">
                        Link to a reusable template instead of custom configuration
                      </p>
                    </div>
                  </div>

                  {/* Template Selector */}
                  {isTemplateMode && (
                    <div className="space-y-2">
                      <Label>Select Template</Label>
                      <Select
                        value={mapping._selectedTemplateId || ""}
                        onValueChange={(value) =>
                          updateComponent(index, "_selectedTemplateId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(templatesByCategory).length === 0 ? (
                            <SelectItem value="none" disabled>
                              No templates available
                            </SelectItem>
                          ) : (
                            Object.entries(templatesByCategory).map(([category, templates]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                                  {category}
                                </div>
                                {templates.map((template) => (
                                  <SelectItem key={template._id} value={template._id}>
                                    {template.name}
                                    {template.defaultConfig?.title &&
                                      ` - ${template.defaultConfig.title}`}
                                  </SelectItem>
                                ))}
                              </div>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedTemplate && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          <strong>Template defaults:</strong> {selectedTemplate.defaultConfig.title}
                          ({selectedTemplate.defaultConfig.baseWeight}g base,
                          {selectedTemplate.defaultConfig.minWeight}-{selectedTemplate.defaultConfig.maxWeight}g range)
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* Title Field */}
                    <div className={overrides.title !== undefined ? "bg-yellow-50 p-2 rounded" : ""}>
                      {isTemplateMode && selectedTemplate && (
                        <div className="flex items-center justify-between mb-1">
                          <Checkbox
                            id={`override-title-${index}`}
                            checked={overrides.title !== undefined}
                            onCheckedChange={(checked) =>
                              updateComponent(index, "override_title", checked as boolean)
                            }
                            className="mr-1"
                          />
                          <Label htmlFor={`override-title-${index}`} className="text-xs text-gray-600 flex-1">
                            Override title
                          </Label>
                        </div>
                      )}
                      <Label>Title</Label>
                      <Input
                        value={component.title}
                        onChange={(e) =>
                          updateComponent(index, "title", e.target.value)
                        }
                        placeholder="e.g., Protein Source"
                        disabled={isTemplateMode && overrides.title === undefined}
                      />
                      {isTemplateMode && selectedTemplate && overrides.title === undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          Template: {selectedTemplate.defaultConfig.title}
                        </p>
                      )}
                    </div>

                    {/* Ingredient Type Field */}
                    <div className={overrides.ingredientType !== undefined ? "bg-yellow-50 p-2 rounded" : ""}>
                      {isTemplateMode && selectedTemplate && (
                        <div className="flex items-center justify-between mb-1">
                          <Checkbox
                            id={`override-ingredientType-${index}`}
                            checked={overrides.ingredientType !== undefined}
                            onCheckedChange={(checked) =>
                              updateComponent(index, "override_ingredientType", checked as boolean)
                            }
                            className="mr-1"
                          />
                          <Label htmlFor={`override-ingredientType-${index}`} className="text-xs text-gray-600 flex-1">
                            Override ingredient type
                          </Label>
                        </div>
                      )}
                      <Label>Ingredient Type</Label>
                      <Select
                        value={component.ingredientType}
                        onValueChange={(value) =>
                          updateComponent(index, "ingredientType", value)
                        }
                        disabled={isTemplateMode && overrides.ingredientType === undefined}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="protein">Protein</SelectItem>
                          <SelectItem value="carbs">Carbs</SelectItem>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="fats">Fats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Weight Settings (grams)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label htmlFor={`base-weight-${index}`}>Base Weight</Label>
                          <Input
                            id={`base-weight-${index}`}
                            type="number"
                            value={component.baseWeight}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "baseWeight",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Base"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`min-weight-${index}`}>Minimum Weight</Label>
                          <Input
                            id={`min-weight-${index}`}
                            type="number"
                            value={component.minWeight}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "minWeight",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Min (100-250g)"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`max-weight-${index}`}>Maximum Weight</Label>
                          <Input
                            id={`max-weight-${index}`}
                            type="number"
                            value={component.maxWeight}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "maxWeight",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Max (100-250g)"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-${index}`}>Step Size</Label>
                          <Input
                            id={`step-${index}`}
                            type="number"
                            value={component.step}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "step",
                                Number(e.target.value)
                              )
                            }
                            placeholder="50"
                          />
                          {validateStep(component.step) && (
                            <p className="text-xs text-red-500 mt-1">
                              {validateStep(component.step)}
                            </p>
                          )}
                        </div>
                      </div>
                      {validateWeightBounds(component) && (
                        <p className="text-xs text-red-500 mt-1">
                          {validateWeightBounds(component)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Base Price ({getCurrencyLabel()})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={component.basePrice}
                        onChange={(e) =>
                          updateComponent(
                            index,
                            "basePrice",
                            Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Price for base weight ({component.baseWeight}g)
                      </p>
                    </div>

                    <div>
                      <Label>Price per Step ({getCurrencyLabel()})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={component.stepPrice}
                        onChange={(e) =>
                          updateComponent(
                            index,
                            "stepPrice",
                            Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Price per {component.step}g increment
                      </p>
                    </div>

                    <div className="col-span-2 flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Checkbox
                        id={`free-weight-${index}`}
                        checked={component.freeWeight}
                        onCheckedChange={(checked) =>
                          updateComponent(index, "freeWeight", checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`free-weight-${index}`}
                          className="font-medium cursor-pointer"
                        >
                          First increment is free
                        </Label>
                        <p className="text-xs text-gray-500">
                          First weight increase won&apos;t add cost
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label>Nutrition per 100g</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">Calories</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.calories}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.calories",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Calories"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Protein (g)</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.protein}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.protein",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Protein (g)"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Carbs (g)</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.carbs}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.carbs",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Carbs (g)"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fat (g)</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.fat}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.fat",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Fat (g)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview Widget */}
                    <div className="col-span-2 border-t pt-4 mt-2">
                      <Label className="text-sm font-semibold mb-2 block">
                        Preview & Calculator
                      </Label>
                      <div className="bg-blue-50 p-4 rounded-md space-y-3">
                        {/* Example Weight Selector */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-xs">Example Weight</Label>
                            <span className="text-sm font-semibold">
                              {component.baseWeight + component.step}g
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Shows calculation for base weight + one increment
                          </p>
                        </div>

                        {/* Price Calculation */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs text-gray-600 mb-1">Price Breakdown</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Base ({component.baseWeight}g):</span>
                                <span className="font-medium">
                                  {formatPrice(component.basePrice)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>+{component.step}g increment:</span>
                                <span className="font-medium">
                                  {component.freeWeight ? (
                                    <span className="text-green-600">FREE</span>
                                  ) : (
                                    formatPrice(component.stepPrice)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between border-t pt-1 font-semibold">
                                <span>Total:</span>
                                <span className="text-blue-600">
                                  {formatPrice(
                                    calculateTotalPrice(
                                      component,
                                      component.baseWeight + component.step
                                    )
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs text-gray-600 mb-1">
                              Nutrition ({component.baseWeight + component.step}g)
                            </p>
                            <div className="space-y-1 text-xs">
                              {(() => {
                                const nutrition = calculateNutrition(
                                  component,
                                  component.baseWeight + component.step
                                );
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Calories:</span>
                                      <span className="font-medium">
                                        {nutrition.calories}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Protein:</span>
                                      <span className="font-medium">
                                        {nutrition.protein}g
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Carbs:</span>
                                      <span className="font-medium">
                                        {nutrition.carbs}g
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Fat:</span>
                                      <span className="font-medium">
                                        {nutrition.fat}g
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Formula Display */}
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-600 font-semibold mb-1">
                            Pricing Formula:
                          </p>
                          <code className="text-xs text-gray-700 block">
                            Total = basePrice + (increments × stepPrice)
                            {component.freeWeight && " - stepPrice (1st free)"}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}

              {formData.components.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No components added yet. Click &quot;Add Component&quot; to
                  create meal components.
                </p>
              )}
            </div>
          )}

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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details.</DialogDescription>
          </DialogHeader>
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
                    <Label htmlFor="edit-name_en">Name (English)</Label>
                    <Input
                      id="edit-name_en"
                      value={formData.name_en}
                      onChange={(e) =>
                        setFormData({ ...formData, name_en: e.target.value })
                      }
                      placeholder="e.g., Falafel Bowl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description_en">Description (English)</Label>
                    <Textarea
                      id="edit-description_en"
                      value={formData.description_en}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description_en: e.target.value,
                        })
                      }
                      placeholder="Optional details for English readers"
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
                      placeholder="مثال: طبق فلافل"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description_ar">Description (Arabic)</Label>
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
                      placeholder="تفاصيل اختيارية باللغة العربية"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div>
              <Label htmlFor="edit-price">{getCurrencyLabel()}</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-basePrice">
                Base {getCurrencyLabel()} (if customizable)
              </Label>
              <Input
                id="edit-basePrice"
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basePrice: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
                disabled={!formData.hasCustomizableComponents}
              />
            </div>
            <div>
              <Label htmlFor="edit-productCategory">Product Category</Label>
              <Select
                value={formData.productCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, productCategory: value })
                }
              >
                <SelectTrigger id="edit-productCategory">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat.productCategoryId || cat._id}
                    >
                      {cat.name_en || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-foodCategory">
                Food Category (Optional)
              </Label>
              <Select
                value={formData.foodCategory}
                onValueChange={(value) =>
                  setFormData({ ...formData, foodCategory: value })
                }
              >
                <SelectTrigger id="edit-foodCategory">
                  <SelectValue placeholder="Select food category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {foodCategories.map((cat) => (
                    <SelectItem
                      key={cat._id}
                      value={cat.foodCategoryId || cat._id}
                    >
                      {cat.name_en || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                uploadEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/v1/product/upload-image`}
                label="Product Image"
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-hasCustomizableComponents"
                checked={formData.hasCustomizableComponents}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasCustomizableComponents: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="edit-hasCustomizableComponents">
                Has Customizable Components
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-hasAddOns"
                checked={formData.hasAddOns}
                onChange={(e) =>
                  setFormData({ ...formData, hasAddOns: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="edit-hasAddOns">Has Add-Ons</Label>
            </div>
          </div>

          {/* Add-Ons Selector */}
          {formData.hasAddOns && (
            <div className="col-span-2 space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Product Add-Ons</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>
                    Available Add-Ons (Check to enable for this product)
                  </Label>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                    {allAddOns.map((addOn) => (
                      <div
                        key={addOn.addOnId}
                        className="border rounded p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`edit-addon-${addOn.addOnId}`}
                              checked={formData.allowedAddOns.includes(
                                addOn.addOnId
                              )}
                              onChange={() => toggleAddOn(addOn.addOnId)}
                              className="rounded"
                            />
                            <Label
                              htmlFor={`edit-addon-${addOn.addOnId}`}
                              className="font-medium"
                            >
                              {addOn.name}
                            </Label>
                            <Badge variant="outline">{addOn.category}</Badge>
                          </div>
                        </div>

                        {formData.allowedAddOns.includes(addOn.addOnId) && (
                          <div className="ml-6 flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm text-gray-600">
                                Base Price: {formatPrice(addOn.price)}
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label
                                htmlFor={`edit-price-${addOn.addOnId}`}
                                className="text-sm"
                              >
                                Custom Price:
                              </Label>
                              <Input
                                id={`edit-price-${addOn.addOnId}`}
                                type="number"
                                step="0.01"
                                value={
                                  formData.addOnPrices[addOn.addOnId] ||
                                  addOn.price
                                }
                                onChange={(e) =>
                                  updateAddOnPrice(
                                    addOn.addOnId,
                                    Number(e.target.value)
                                  )
                                }
                                className="w-24"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {allAddOns.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No add-ons available. Please create add-ons first.
                      </p>
                    )}
                  </div>
                </div>

                {formData.allowedAddOns.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">
                      Selected Add-Ons: {formData.allowedAddOns.length}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Custom prices will override the base add-on price for this
                      product only.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meal Components Editor */}
          {formData.hasCustomizableComponents && (
            <div className="col-span-2 space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Meal Components</h3>
                <Button type="button" size="sm" onClick={addComponent}>
                  + Add Component
                </Button>
              </div>

              {formData.components.map((component, index) => {
                const mapping = formData.componentMappings[index];
                const isTemplateMode = mapping?._useTemplate || false;
                const selectedTemplate = isTemplateMode && mapping._selectedTemplateId
                  ? allTemplates.find(t => t._id === mapping._selectedTemplateId)
                  : null;
                const overrides = mapping?.overrides || {};

                // Group templates by ingredient type
                const templatesByCategory = allTemplates.reduce((acc, template) => {
                  const category = template.defaultConfig?.ingredientType || 'Other';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(template);
                  return acc;
                }, {} as Record<string, typeof allTemplates>);

                return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Component {index + 1}</h4>
                      {isTemplateMode ? (
                        <Badge variant="default" className="bg-blue-500">Template</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                      {selectedTemplate && (
                        <span className="text-xs text-gray-500">({selectedTemplate.name})</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeComponent(index)}
                    >
                      Remove
                    </Button>
                  </div>

                  {/* Template Mode Toggle */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border">
                    <Checkbox
                      id={`edit-use-template-${index}`}
                      checked={isTemplateMode}
                      onCheckedChange={(checked) =>
                        updateComponent(index, "_useTemplate", checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`edit-use-template-${index}`}
                        className="font-medium cursor-pointer"
                      >
                        Use Template
                      </Label>
                      <p className="text-xs text-gray-500">
                        Link to a reusable template instead of custom configuration
                      </p>
                    </div>
                  </div>

                  {/* Template Selector */}
                  {isTemplateMode && (
                    <div className="space-y-2">
                      <Label>Select Template</Label>
                      <Select
                        value={mapping._selectedTemplateId || ""}
                        onValueChange={(value) =>
                          updateComponent(index, "_selectedTemplateId", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(templatesByCategory).length === 0 ? (
                            <SelectItem value="none" disabled>
                              No templates available
                            </SelectItem>
                          ) : (
                            Object.entries(templatesByCategory).map(([category, templates]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                                  {category}
                                </div>
                                {templates.map((template) => (
                                  <SelectItem key={template._id} value={template._id}>
                                    {template.name}
                                    {template.defaultConfig?.title &&
                                      ` - ${template.defaultConfig.title}`}
                                  </SelectItem>
                                ))}
                              </div>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {selectedTemplate && (
                        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                          <strong>Template defaults:</strong> {selectedTemplate.defaultConfig.title}
                          ({selectedTemplate.defaultConfig.baseWeight}g base,
                          {selectedTemplate.defaultConfig.minWeight}-{selectedTemplate.defaultConfig.maxWeight}g range)
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {/* Title Field */}
                    <div className={overrides.title !== undefined ? "bg-yellow-50 p-2 rounded" : ""}>
                      {isTemplateMode && selectedTemplate && (
                        <div className="flex items-center justify-between mb-1">
                          <Checkbox
                            id={`edit-override-title-${index}`}
                            checked={overrides.title !== undefined}
                            onCheckedChange={(checked) =>
                              updateComponent(index, "override_title", checked as boolean)
                            }
                            className="mr-1"
                          />
                          <Label htmlFor={`edit-override-title-${index}`} className="text-xs text-gray-600 flex-1">
                            Override title
                          </Label>
                        </div>
                      )}
                      <Label>Title</Label>
                      <Input
                        value={component.title}
                        onChange={(e) =>
                          updateComponent(index, "title", e.target.value)
                        }
                        placeholder="e.g., Protein Source"
                        disabled={isTemplateMode && overrides.title === undefined}
                      />
                      {isTemplateMode && selectedTemplate && overrides.title === undefined && (
                        <p className="text-xs text-gray-500 mt-1">
                          Template: {selectedTemplate.defaultConfig.title}
                        </p>
                      )}
                    </div>

                    {/* Ingredient Type Field */}
                    <div className={overrides.ingredientType !== undefined ? "bg-yellow-50 p-2 rounded" : ""}>
                      {isTemplateMode && selectedTemplate && (
                        <div className="flex items-center justify-between mb-1">
                          <Checkbox
                            id={`edit-override-ingredientType-${index}`}
                            checked={overrides.ingredientType !== undefined}
                            onCheckedChange={(checked) =>
                              updateComponent(index, "override_ingredientType", checked as boolean)
                            }
                            className="mr-1"
                          />
                          <Label htmlFor={`edit-override-ingredientType-${index}`} className="text-xs text-gray-600 flex-1">
                            Override ingredient type
                          </Label>
                        </div>
                      )}
                      <Label>Ingredient Type</Label>
                      <Select
                        value={component.ingredientType}
                        onValueChange={(value) =>
                          updateComponent(index, "ingredientType", value)
                        }
                        disabled={isTemplateMode && overrides.ingredientType === undefined}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="protein">Protein</SelectItem>
                          <SelectItem value="carbs">Carbs</SelectItem>
                          <SelectItem value="vegetables">Vegetables</SelectItem>
                          <SelectItem value="fats">Fats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Weight Settings (grams)</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label htmlFor={`edit-base-weight-${index}`}>Base Weight</Label>
                          <Input
                            id={`edit-base-weight-${index}`}
                            type="number"
                            value={component.baseWeight}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "baseWeight",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Base"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-min-weight-${index}`}>Minimum Weight</Label>
                          <Input
                            id={`edit-min-weight-${index}`}
                            type="number"
                            value={component.minWeight}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "minWeight",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Min (100-250g)"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-max-weight-${index}`}>Maximum Weight</Label>
                          <Input
                            id={`edit-max-weight-${index}`}
                            type="number"
                            value={component.maxWeight}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "maxWeight",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Max (100-250g)"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`edit-step-${index}`}>Step Size</Label>
                          <Input
                            id={`edit-step-${index}`}
                            type="number"
                            value={component.step}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "step",
                                Number(e.target.value)
                              )
                            }
                            placeholder="50"
                          />
                          {validateStep(component.step) && (
                            <p className="text-xs text-red-500 mt-1">
                              {validateStep(component.step)}
                            </p>
                          )}
                        </div>
                      </div>
                      {validateWeightBounds(component) && (
                        <p className="text-xs text-red-500 mt-1">
                          {validateWeightBounds(component)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Base Price ({getCurrencyLabel()})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={component.basePrice}
                        onChange={(e) =>
                          updateComponent(
                            index,
                            "basePrice",
                            Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Price for base weight ({component.baseWeight}g)
                      </p>
                    </div>

                    <div>
                      <Label>Price per Step ({getCurrencyLabel()})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={component.stepPrice}
                        onChange={(e) =>
                          updateComponent(
                            index,
                            "stepPrice",
                            Number(e.target.value)
                          )
                        }
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Price per {component.step}g increment
                      </p>
                    </div>

                    <div className="col-span-2 flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                      <Checkbox
                        id={`edit-free-weight-${index}`}
                        checked={component.freeWeight}
                        onCheckedChange={(checked) =>
                          updateComponent(index, "freeWeight", checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`edit-free-weight-${index}`}
                          className="font-medium cursor-pointer"
                        >
                          First increment is free
                        </Label>
                        <p className="text-xs text-gray-500">
                          First weight increase won&apos;t add cost
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <Label>Nutrition per 100g</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <Label className="text-xs">Calories</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.calories}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.calories",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Calories"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Protein (g)</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.protein}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.protein",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Protein (g)"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Carbs (g)</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.carbs}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.carbs",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Carbs (g)"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fat (g)</Label>
                          <Input
                            type="number"
                            value={component.nutritionPer100g.fat}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "nutritionPer100g.fat",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Fat (g)"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview Widget */}
                    <div className="col-span-2 border-t pt-4 mt-2">
                      <Label className="text-sm font-semibold mb-2 block">
                        Preview & Calculator
                      </Label>
                      <div className="bg-blue-50 p-4 rounded-md space-y-3">
                        {/* Example Weight Selector */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-xs">Example Weight</Label>
                            <span className="text-sm font-semibold">
                              {component.baseWeight + component.step}g
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Shows calculation for base weight + one increment
                          </p>
                        </div>

                        {/* Price Calculation */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs text-gray-600 mb-1">Price Breakdown</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Base ({component.baseWeight}g):</span>
                                <span className="font-medium">
                                  {formatPrice(component.basePrice)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>+{component.step}g increment:</span>
                                <span className="font-medium">
                                  {component.freeWeight ? (
                                    <span className="text-green-600">FREE</span>
                                  ) : (
                                    formatPrice(component.stepPrice)
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between border-t pt-1 font-semibold">
                                <span>Total:</span>
                                <span className="text-blue-600">
                                  {formatPrice(
                                    calculateTotalPrice(
                                      component,
                                      component.baseWeight + component.step
                                    )
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs text-gray-600 mb-1">
                              Nutrition ({component.baseWeight + component.step}g)
                            </p>
                            <div className="space-y-1 text-xs">
                              {(() => {
                                const nutrition = calculateNutrition(
                                  component,
                                  component.baseWeight + component.step
                                );
                                return (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Calories:</span>
                                      <span className="font-medium">
                                        {nutrition.calories}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Protein:</span>
                                      <span className="font-medium">
                                        {nutrition.protein}g
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Carbs:</span>
                                      <span className="font-medium">
                                        {nutrition.carbs}g
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Fat:</span>
                                      <span className="font-medium">
                                        {nutrition.fat}g
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Formula Display */}
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-600 font-semibold mb-1">
                            Pricing Formula:
                          </p>
                          <code className="text-xs text-gray-700 block">
                            Total = basePrice + (increments × stepPrice)
                            {component.freeWeight && " - stepPrice (1st free)"}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}

              {formData.components.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No components added yet. Click &quot;Add Component&quot; to
                  create meal components.
                </p>
              )}
            </div>
          )}

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
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name_en || selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
