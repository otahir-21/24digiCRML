"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Plus, X, Save, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  braceletProductService,
  type BraceletProduct,
  type UpdateBraceletProductDto,
  type ProductVariant,
  type CustomizationOption,
  type ProductSpecification,
  ProductType,
} from "@/lib/services/bracelet-product.service";
import { SpecificationEditor } from "@/components/specifications-editor";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<BraceletProduct | null>(null);

  // Basic product info - Bilingual
  const [productName_en, setProductName_en] = useState("");
  const [productName_ar, setProductName_ar] = useState("");
  const [description_en, setDescription_en] = useState("");
  const [description_ar, setDescription_ar] = useState("");
  const [shortDescription_en, setShortDescription_en] = useState("");
  const [shortDescription_ar, setShortDescription_ar] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [gender, setGender] = useState("");
  const [style, setStyle] = useState("");
  const [collection, setCollection] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // New product fields
  const [productType, setProductType] = useState<ProductType>(
    ProductType.PERFORMANCE
  );
  const [originalPrice, setOriginalPrice] = useState(0);
  const [specifications, setSpecifications] = useState<ProductSpecification[]>(
    []
  );
  const [inStock, setInStock] = useState(true);

  // Pricing and availability
  const [basePrice, setBasePrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [onSale, setOnSale] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isLimitedEdition, setIsLimitedEdition] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Materials and features
  const [materials, setMaterials] = useState<string[]>([]);
  const [newMaterial, setNewMaterial] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [careInstructions, setCareInstructions] = useState<string[]>([]);
  const [newCareInstruction, setNewCareInstruction] = useState("");
  const [warranty, setWarranty] = useState("");

  // SEO
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");

  // Shipping
  const [weight, setWeight] = useState(0);
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [shippingClass, setShippingClass] = useState("");
  const [handlingTime, setHandlingTime] = useState(1);

  // Product variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Product images
  const [mainImageUrl, setMainImageUrl] = useState<string>("");

  // Customization options
  const [allowCustomization, setAllowCustomization] = useState(false);
  const [customizations, setCustomizations] = useState<CustomizationOption[]>(
    []
  );

  // Admin fields
  const [vendor, setVendor] = useState("");
  const [costPrice, setCostPrice] = useState(0);
  const [internalNotes, setInternalNotes] = useState("");

  // Load product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setInitialLoading(true);
        const productData = await braceletProductService.getProduct(productId);
        setProduct(productData);

        // Populate form fields with bilingual data
        setProductName_en(productData.name_en || productData.name || "");
        setProductName_ar(productData.name_ar || "");
        setDescription_en(
          productData.description_en || productData.description || ""
        );
        setDescription_ar(productData.description_ar || "");
        setShortDescription_en(
          productData.shortDescription_en || productData.shortDescription || ""
        );
        setShortDescription_ar(productData.shortDescription_ar || "");
        setCategory(productData.category);
        setBrand(productData.brand);
        setGender(productData.gender);
        setStyle(productData.style);
        setCollection(productData.collection || "");
        setTags(productData.tags);

        // New fields
        setProductType(productData.type || ProductType.PERFORMANCE);
        setOriginalPrice(productData.originalPrice || 0);
        setSpecifications(productData.specifications || []);
        setInStock(productData.inStock ?? true);

        setBasePrice(productData.basePrice);
        setSalePrice(productData.salePrice || 0);
        setOnSale(productData.onSale);
        setIsActive(productData.isActive);
        setIsFeatured(productData.isFeatured);
        setIsNewArrival(productData.isNewArrival);
        setIsBestseller(productData.isBestseller);
        setIsLimitedEdition(productData.isLimitedEdition);
        setLowStockThreshold(productData.lowStockThreshold);

        // Extract string names from MaterialInfo objects
        setMaterials(
          (productData.materials || []).map(
            (m) =>
              typeof m === "string"
                ? m
                : m.name_en || ""
          )
        );
        setFeatures(productData.features || []);
        setCareInstructions(productData.careInstructions || []);
        setWarranty(productData.warranty || "");

        setMetaTitle(productData.seo?.metaTitle || "");
        setMetaDescription(productData.seo?.metaDescription || "");
        setSlug(productData.seo?.slug || "");

        setWeight(productData.shippingInfo?.weight || 0);
        setLength(productData.shippingInfo?.dimensions?.length || 0);
        setWidth(productData.shippingInfo?.dimensions?.width || 0);
        setHeight(productData.shippingInfo?.dimensions?.height || 0);
        setShippingClass(productData.shippingInfo?.shippingClass || "");
        setHandlingTime(productData.shippingInfo?.handlingTime || 1);

        setVariants(productData.variants || []);
        // Set main image URL from the first image
        if (productData.images && productData.images.length > 0) {
          setMainImageUrl(productData.images[0].url);
        }

        setAllowCustomization(productData.allowCustomization || false);
        setCustomizations(productData.customizationOptions || []);

        setVendor(productData.vendor || "");
        setCostPrice(productData.costPrice || 0);
        setInternalNotes(productData.internalNotes || "");
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product data",
          variant: "destructive",
        });
        router.push("/dashboard/bracelets/products");
      } finally {
        setInitialLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router, toast]);

  const handleSaveProduct = async () => {
    if (!productName_en || !description_en || !brand || !category) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required fields (English name and description required)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const updateData: UpdateBraceletProductDto = {
        name_en: productName_en,
        name_ar: productName_ar || undefined,
        description_en: description_en,
        description_ar: description_ar || undefined,
        shortDescription_en: shortDescription_en || undefined,
        shortDescription_ar: shortDescription_ar || undefined,
        brand,
        category,
        gender,
        style,
        collection: collection || undefined,
        // New fields
        type: productType,
        originalPrice: originalPrice > 0 ? originalPrice : undefined,
        specifications,
        inStock,
        // Pricing
        basePrice,
        salePrice: onSale && salePrice > 0 ? salePrice : undefined,
        onSale,
        isActive,
        isFeatured,
        isNewArrival,
        isBestseller,
        isLimitedEdition,
        lowStockThreshold,
        // Transform string[] back to MaterialInfo[] for API
        materials: materials.map((m) => ({
          name_en: m,
          name: m,
        })),
        features,
        careInstructions:
          careInstructions.length > 0 ? careInstructions : undefined,
        warranty: warranty || undefined,
        tags,
        seo: {
          metaTitle: metaTitle || undefined,
          metaDescription: metaDescription || undefined,
          slug: slug || undefined,
        },
        shippingInfo: {
          weight,
          dimensions: {
            length,
            width,
            height,
          },
          shippingClass: shippingClass || undefined,
          handlingTime,
        },
        variants,
        images: mainImageUrl
          ? [
              {
                imageId: "1",
                url: mainImageUrl,
                alt: productName_en,
                isPrimary: true,
                sortOrder: 0,
              },
            ]
          : [],
        allowCustomization,
        customizationOptions: customizations,
        vendor: vendor || undefined,
        costPrice: costPrice > 0 ? costPrice : undefined,
        internalNotes: internalNotes || undefined,
      };

      await braceletProductService.updateProduct(productId, updateData);

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      router.push(`/dashboard/bracelets/products/${productId}`);
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const addMaterial = () => {
    if (newMaterial && !materials.includes(newMaterial)) {
      setMaterials([...materials, newMaterial]);
      setNewMaterial("");
    }
  };

  const removeMaterial = (materialToRemove: string) => {
    setMaterials(materials.filter((material) => material !== materialToRemove));
  };

  const addFeature = () => {
    if (newFeature && !features.includes(newFeature)) {
      setFeatures([...features, newFeature]);
      setNewFeature("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter((feature) => feature !== featureToRemove));
  };

  const addCareInstruction = () => {
    if (newCareInstruction && !careInstructions.includes(newCareInstruction)) {
      setCareInstructions([...careInstructions, newCareInstruction]);
      setNewCareInstruction("");
    }
  };

  const removeCareInstruction = (instructionToRemove: string) => {
    setCareInstructions(
      careInstructions.filter(
        (instruction) => instruction !== instructionToRemove
      )
    );
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Product Not Found</h2>
        <p className="text-muted-foreground">
          The product {`you're`} trying to edit {`doesn't`} exist or has been
          removed.
        </p>
        <Button asChild>
          <Link href="/dashboard/bracelets/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/bracelets/products/${productId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Product
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product information and settings
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/bracelets/products/${productId}`}>
              Cancel
            </Link>
          </Button>
          <Button onClick={handleSaveProduct} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Stock</TabsTrigger>
          <TabsTrigger value="features">Features & Media</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic">
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
                      <div>
                        <Label htmlFor="name_en">
                          Product Name (English) *
                        </Label>
                        <Input
                          id="name_en"
                          value={productName_en}
                          onChange={(e) => setProductName_en(e.target.value)}
                          placeholder="e.g., Gold Chain Bracelet"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shortDescription_en">
                          Short Description (English)
                        </Label>
                        <Textarea
                          id="shortDescription_en"
                          value={shortDescription_en}
                          onChange={(e) =>
                            setShortDescription_en(e.target.value)
                          }
                          placeholder="Brief product summary"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_en">
                          Description (English) *
                        </Label>
                        <Textarea
                          id="description_en"
                          value={description_en}
                          onChange={(e) => setDescription_en(e.target.value)}
                          placeholder="Detailed product description"
                          rows={4}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="ar" className="space-y-3 mt-4">
                      <div>
                        <Label htmlFor="name_ar">Product Name (Arabic)</Label>
                        <Input
                          id="name_ar"
                          dir="rtl"
                          value={productName_ar}
                          onChange={(e) => setProductName_ar(e.target.value)}
                          placeholder="مثال: سوار ذهبي"
                        />
                      </div>
                      <div>
                        <Label htmlFor="shortDescription_ar">
                          Short Description (Arabic)
                        </Label>
                        <Textarea
                          id="shortDescription_ar"
                          dir="rtl"
                          value={shortDescription_ar}
                          onChange={(e) =>
                            setShortDescription_ar(e.target.value)
                          }
                          placeholder="ملخص موجز للمنتج"
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_ar">
                          Description (Arabic)
                        </Label>
                        <Textarea
                          id="description_ar"
                          dir="rtl"
                          value={description_ar}
                          onChange={(e) => setDescription_ar(e.target.value)}
                          placeholder="وصف تفصيلي للمنتج"
                          rows={4}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Product brand"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="charm">Charm Bracelets</SelectItem>
                        <SelectItem value="tennis">Tennis Bracelets</SelectItem>
                        <SelectItem value="chain">Chain Bracelets</SelectItem>
                        <SelectItem value="bangle">Bangles</SelectItem>
                        <SelectItem value="cuff">Cuff Bracelets</SelectItem>
                        <SelectItem value="beaded">Beaded Bracelets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="women">Women</SelectItem>
                        <SelectItem value="men">Men</SelectItem>
                        <SelectItem value="unisex">Unisex</SelectItem>
                        <SelectItem value="kids">Kids</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="style">Style</Label>
                    <Input
                      id="style"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      placeholder="e.g., Modern, Classic, Vintage"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="collection">Collection</Label>
                  <Input
                    id="collection"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    placeholder="Product collection name"
                  />
                </div>

                <div>
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select
                    value={productType}
                    onValueChange={(value) =>
                      setProductType(value as ProductType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ProductType.PERFORMANCE}>
                        Performance
                      </SelectItem>
                      <SelectItem value={ProductType.SAFE_LIFE}>
                        Safe Life
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
                <CardDescription>
                  Technical specifications and features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SpecificationEditor
                  specifications={specifications}
                  onChange={setSpecifications}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pricing and Stock */}
        <TabsContent value="pricing">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Information</CardTitle>
                <CardDescription>
                  Set product pricing and discounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="basePrice">Base Price *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <Label htmlFor="originalPrice">Original Price</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(Number(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="onSale"
                    checked={onSale}
                    onCheckedChange={setOnSale}
                  />
                  <Label htmlFor="onSale">On Sale</Label>
                </div>

                {onSale && (
                  <div>
                    <Label htmlFor="salePrice">Sale Price</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Management</CardTitle>
                <CardDescription>
                  Inventory and availability settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inStock"
                    checked={inStock}
                    onCheckedChange={setInStock}
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={setIsFeatured}
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>

                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) =>
                      setLowStockThreshold(Number(e.target.value))
                    }
                    placeholder="5"
                    min="0"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Features and Media */}
        <TabsContent value="features">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Features</CardTitle>
                <CardDescription>Materials and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Materials */}
                <div>
                  <Label>Materials</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      placeholder="Add material"
                      onKeyPress={(e) => e.key === "Enter" && addMaterial()}
                    />
                    <Button type="button" onClick={addMaterial} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {materials.map((material) => (
                      <Badge
                        key={material}
                        variant="secondary"
                        className="cursor-pointer"
                      >
                        {material}
                        <X
                          className="h-3 w-3 ml-1"
                          onClick={() => removeMaterial(material)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <Label>Features</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add feature"
                      onKeyPress={(e) => e.key === "Enter" && addFeature()}
                    />
                    <Button type="button" onClick={addFeature} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {features.map((feature) => (
                      <Badge
                        key={feature}
                        variant="secondary"
                        className="cursor-pointer"
                      >
                        {feature}
                        <X
                          className="h-3 w-3 ml-1"
                          onClick={() => removeFeature(feature)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Care Instructions */}
                <div>
                  <Label>Care Instructions</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newCareInstruction}
                      onChange={(e) => setNewCareInstruction(e.target.value)}
                      placeholder="Add care instruction"
                      onKeyPress={(e) =>
                        e.key === "Enter" && addCareInstruction()
                      }
                    />
                    <Button
                      type="button"
                      onClick={addCareInstruction}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {careInstructions.map((instruction) => (
                      <Badge
                        key={instruction}
                        variant="secondary"
                        className="cursor-pointer"
                      >
                        {instruction}
                        <X
                          className="h-3 w-3 ml-1"
                          onClick={() => removeCareInstruction(instruction)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input
                    id="warranty"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g., 1 year manufacturer warranty"
                  />
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 ml-1"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload and manage product images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  value={mainImageUrl}
                  onChange={setMainImageUrl}
                  uploadEndpoint={`${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
                  }/v1/bracelet-products/upload-image`}
                  disabled={loading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Search engine optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO meta title"
                  />
                </div>
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO meta description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="product-url-slug"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>Internal management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Vendor name"
                  />
                </div>
                <div>
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea
                    id="internalNotes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Internal notes for admin use"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
