"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, Upload, X, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProductVariant {
  variantId: string;
  size: string;
  color: string;
  material: string;
  price: number;
  sku: string;
  stock: number;
  weight: number;
}

interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface CustomizationOption {
  optionId: string;
  name: string;
  type: "text" | "selection";
  additionalPrice: number;
  isRequired: boolean;
  options?: string[];
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Basic product info - Bilingual
  const [productName_en, setProductName_en] = useState("");
  const [productName_ar, setProductName_ar] = useState("");
  const [description_en, setDescription_en] = useState("");
  const [description_ar, setDescription_ar] = useState("");
  const [shortDescription_en, setShortDescription_en] = useState("");
  const [shortDescription_ar, setShortDescription_ar] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // Pricing and availability
  const [basePrice, setBasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [onSale, setOnSale] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");

  // Product variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      variantId: "1",
      size: "Small",
      color: "Gold",
      material: "Gold Plated",
      price: basePrice,
      sku: "",
      stock: 0,
      weight: 0,
    },
  ]);

  // Product images
  const [images, setImages] = useState<ProductImage[]>([]);

  // Customization options
  const [customizations, setCustomizations] = useState<CustomizationOption[]>(
    []
  );

  const generateSKU = () => {
    const prefix = category.slice(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      variantId: (variants.length + 1).toString(),
      size: "",
      color: "",
      material: "",
      price: basePrice,
      sku: generateSKU(),
      stock: 0,
      weight: 0,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (variantId: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter((v) => v.variantId !== variantId));
    }
  };

  const updateVariant = (
    variantId: string,
    field: keyof ProductVariant,
    value: string | number | boolean
  ) => {
    setVariants(
      variants.map((v) =>
        v.variantId === variantId ? { ...v, [field]: value } : v
      )
    );
  };

  const addCustomization = () => {
    const newCustomization: CustomizationOption = {
      optionId: (customizations.length + 1).toString(),
      name: "",
      type: "text",
      additionalPrice: 0,
      isRequired: false,
      options: [],
    };
    setCustomizations([...customizations, newCustomization]);
  };

  const removeCustomization = (optionId: string) => {
    setCustomizations(customizations.filter((c) => c.optionId !== optionId));
  };

  const updateCustomization = (
    optionId: string,
    field: keyof CustomizationOption,
    value: string | number | boolean | string[]
  ) => {
    setCustomizations(
      customizations.map((c) =>
        c.optionId === optionId ? { ...c, [field]: value } : c
      )
    );
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement actual image upload
    console.log("Image upload:", event.target.files);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const productData = {
        name_en: productName_en,
        name_ar: productName_ar || undefined,
        description_en: description_en,
        description_ar: description_ar || undefined,
        shortDescription_en: shortDescription_en || undefined,
        shortDescription_ar: shortDescription_ar || undefined,
        category,
        brand,
        tags,
        basePrice,
        salePrice: onSale ? salePrice : undefined,
        onSale,
        isActive,
        isFeatured,
        lowStockThreshold,
        variants,
        images,
        customizationOptions: customizations,
        seo: {
          metaTitle,
          metaDescription,
          slug: slug || generateSlug(productName_en),
        },
      };

      // TODO: Replace with actual API call
      console.log("Creating product:", productData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      router.push("/dashboard/bracelets/products");
    } catch (error) {
      console.error("Error creating product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/bracelets/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Add New Product
            </h1>
            <p className="text-muted-foreground">
              Create a new bracelet product with variants and customization
              options
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !productName_en}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  Basic details about the product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Localized Content</Label>
                  <Tabs defaultValue="en" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                      <TabsTrigger value="ar">🇦🇪 Arabic</TabsTrigger>
                    </TabsList>

                    <TabsContent value="en" className="space-y-3 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_en">
                          Product Name (English) *
                        </Label>
                        <Input
                          id="name_en"
                          value={productName_en}
                          onChange={(e) => {
                            setProductName_en(e.target.value);
                            if (!slug) {
                              setSlug(generateSlug(e.target.value));
                            }
                          }}
                          placeholder="e.g., Gold Chain Bracelet"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shortDescription_en">
                          Short Description (English)
                        </Label>
                        <Input
                          id="shortDescription_en"
                          value={shortDescription_en}
                          onChange={(e) =>
                            setShortDescription_en(e.target.value)
                          }
                          placeholder="Brief description for listings"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_en">
                          Description (English)
                        </Label>
                        <Textarea
                          id="description_en"
                          value={description_en}
                          onChange={(e) => setDescription_en(e.target.value)}
                          placeholder="Detailed product description"
                          rows={5}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ar" className="space-y-3 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name_ar">Product Name (Arabic)</Label>
                        <Input
                          id="name_ar"
                          dir="rtl"
                          value={productName_ar}
                          onChange={(e) => setProductName_ar(e.target.value)}
                          placeholder="مثال: سوار ذهبي"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shortDescription_ar">
                          Short Description (Arabic)
                        </Label>
                        <Input
                          id="shortDescription_ar"
                          dir="rtl"
                          value={shortDescription_ar}
                          onChange={(e) =>
                            setShortDescription_ar(e.target.value)
                          }
                          placeholder="وصف مختصر"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description_ar">
                          Description (Arabic)
                        </Label>
                        <Textarea
                          id="description_ar"
                          dir="rtl"
                          value={description_ar}
                          onChange={(e) => setDescription_ar(e.target.value)}
                          placeholder="وصف تفصيلي للمنتج"
                          rows={5}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chain Bracelets">
                          Chain Bracelets
                        </SelectItem>
                        <SelectItem value="Charm Bracelets">
                          Charm Bracelets
                        </SelectItem>
                        <SelectItem value="Leather Bracelets">
                          Leather Bracelets
                        </SelectItem>
                        <SelectItem value="Diamond Bracelets">
                          Diamond Bracelets
                        </SelectItem>
                        <SelectItem value="Beaded Bracelets">
                          Beaded Bracelets
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Product brand"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Availability</CardTitle>
                <CardDescription>
                  Set pricing and availability options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) =>
                        setBasePrice(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">
                      Low Stock Threshold
                    </Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={lowStockThreshold}
                      onChange={(e) =>
                        setLowStockThreshold(parseInt(e.target.value) || 5)
                      }
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="onSale">On Sale</Label>
                    <Switch
                      id="onSale"
                      checked={onSale}
                      onCheckedChange={setOnSale}
                    />
                  </div>

                  {onSale && (
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Sale Price</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        step="0.01"
                        value={salePrice}
                        onChange={(e) =>
                          setSalePrice(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Active</Label>
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="isFeatured">Featured Product</Label>
                    <Switch
                      id="isFeatured"
                      checked={isFeatured}
                      onCheckedChange={setIsFeatured}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="variants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Product Variants</span>
                <Button onClick={addVariant}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </CardTitle>
              <CardDescription>
                Create different variants with sizes, colors, and materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {variants.map((variant, index) => (
                <div
                  key={variant.variantId}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Variant {index + 1}</h4>
                    {variants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(variant.variantId)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select
                        value={variant.size}
                        onValueChange={(value) =>
                          updateVariant(variant.variantId, "size", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="Small">Small</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Large">Large</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                          <SelectItem value="One Size">One Size</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Input
                        value={variant.color}
                        onChange={(e) =>
                          updateVariant(
                            variant.variantId,
                            "color",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Input
                        value={variant.material}
                        onChange={(e) =>
                          updateVariant(
                            variant.variantId,
                            "material",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Gold Plated"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(
                            variant.variantId,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(
                            variant.variantId,
                            "sku",
                            e.target.value
                          )
                        }
                        placeholder="Auto-generated"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(
                            variant.variantId,
                            "stock",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={variant.weight}
                        onChange={(e) =>
                          updateVariant(
                            variant.variantId,
                            "weight",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload product images and set primary image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Images</h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop your images here, or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button variant="outline" asChild>
                    <span>Choose Files</span>
                  </Button>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        width={200}
                        height={128}
                        className="w-full h-32 object-cover"
                      />
                      {image.isPrimary && (
                        <Badge
                          className="absolute top-2 left-2"
                          variant="default"
                        >
                          Primary
                        </Badge>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImages(images.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Customization Options</span>
                <Button onClick={addCustomization}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </CardTitle>
              <CardDescription>
                Add customization options like engraving, gift wrapping, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {customizations.map((customization, index) => (
                <div
                  key={customization.optionId}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Option {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        removeCustomization(customization.optionId)
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Option Name</Label>
                      <Input
                        value={customization.name}
                        onChange={(e) =>
                          updateCustomization(
                            customization.optionId,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Engraving"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={customization.type}
                        onValueChange={(value) =>
                          updateCustomization(
                            customization.optionId,
                            "type",
                            value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Input</SelectItem>
                          <SelectItem value="selection">Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={customization.additionalPrice}
                        onChange={(e) =>
                          updateCustomization(
                            customization.optionId,
                            "additionalPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Required</Label>
                      <div className="pt-2">
                        <Switch
                          checked={customization.isRequired}
                          onCheckedChange={(checked) =>
                            updateCustomization(
                              customization.optionId,
                              "isRequired",
                              checked
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {customization.type === "selection" && (
                    <div className="space-y-2">
                      <Label>Selection Options (one per line)</Label>
                      <Textarea
                        value={customization.options?.join("\n") || ""}
                        onChange={(e) =>
                          updateCustomization(
                            customization.optionId,
                            "options",
                            e.target.value.split("\n").filter(Boolean)
                          )
                        }
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              ))}

              {customizations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No customization options added yet. Click {`"Add Option"`} to
                  get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize your product for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="product-url-slug"
                />
                <p className="text-sm text-muted-foreground">
                  URL: /products/{slug || "product-url-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title for search engines"
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground">
                  {metaTitle.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO description for search engines"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  {metaDescription.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
