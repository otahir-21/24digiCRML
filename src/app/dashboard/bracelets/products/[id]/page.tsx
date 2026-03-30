"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  Edit,
  Star,
  Package,
  DollarSign,
  Eye,
  ShoppingCart,
  AlertCircle,
  Info,
  MoreHorizontal,
  Download,
  Share2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  braceletProductService,
  type BraceletProduct,
} from "@/lib/services/bracelet-product.service";

export default function ProductDetailPage() {
  const params = useParams();

  const { toast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = useState<BraceletProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await braceletProductService.getProduct(productId);
        setProduct(productData);
        setError(null);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product details");
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, toast]);

  const handleToggleStatus = async () => {
    if (!product) return;

    try {
      const updatedProduct = await braceletProductService.toggleProductStatus(
        productId
      );
      setProduct(updatedProduct);
      toast({
        title: "Success",
        description: `Product ${
          updatedProduct.isActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      console.error("Error updating product status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Product Not Found</h2>
        <p className="text-muted-foreground">
          The product {`you're`} looking for {`doesn't`} exist or has been
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

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];
  const discountPercentage =
    product.salePrice && product.basePrice > product.salePrice
      ? Math.round(
          ((product.basePrice - product.salePrice) / product.basePrice) * 100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/bracelets/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">
              Product ID: {product.productId}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/bracelets/products/${productId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus}>
                <Package className="h-4 w-4 mr-2" />
                {product.isActive ? "Deactivate" : "Activate"} Product
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link href={`/dashboard/bracelets/products/${productId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={product.isActive ? "default" : "secondary"}>
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
        {product.isFeatured && (
          <Badge variant="outline" className="text-purple-600">
            Featured
          </Badge>
        )}
        {product.onSale && discountPercentage > 0 && (
          <Badge variant="outline" className="text-green-600">
            {discountPercentage}% Off
          </Badge>
        )}
        {product.isNewArrival && (
          <Badge variant="outline" className="text-blue-600">
            New Arrival
          </Badge>
        )}
        {product.isBestseller && (
          <Badge variant="outline" className="text-orange-600">
            Bestseller
          </Badge>
        )}
        {product.isLimitedEdition && (
          <Badge variant="outline" className="text-red-600">
            Limited Edition
          </Badge>
        )}
        {product.totalStock <= product.lowStockThreshold && (
          <Badge variant="destructive">Low Stock</Badge>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image & Gallery */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {primaryImage && (
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt || product.name || 'Product image'}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(0, 4).map((image, index) => (
                    <div
                      key={image.imageId || `image-${index}`}
                      className="aspect-square relative rounded-md overflow-hidden bg-gray-100"
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Brand
                  </p>
                  <p className="text-sm">{product.brand}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <p className="text-sm">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gender
                  </p>
                  <p className="text-sm">{product.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Style
                  </p>
                  <p className="text-sm">{product.style}</p>
                </div>
                {product.collection && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Collection
                    </p>
                    <p className="text-sm">{product.collection}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </p>
                <p className="text-sm">{product.description}</p>
              </div>

              {product.features && product.features.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Features
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {product.materials && product.materials.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Materials
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.materials.map((material, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {typeof material === "string"
                          ? material
                          : material?.name || "Unknown Material"}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  {product.onSale && product.salePrice ? (
                    <>
                      <span className="text-2xl font-bold text-green-600">
                        ${product.salePrice.toFixed(2)}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        ${product.basePrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">
                      ${product.basePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Currency</p>
                    <p className="font-medium">{product.currency}</p>
                  </div>
                  {product.costPrice && (
                    <div>
                      <p className="text-muted-foreground">Cost Price</p>
                      <p className="font-medium">
                        ${product.costPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {product.totalStock}
                  </span>
                  <span className="text-muted-foreground">units</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Low Stock Alert</p>
                    <p className="font-medium">{product.lowStockThreshold}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Variants</p>
                    <p className="font-medium">{product.variants.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{product.salesCount}</p>
                    <p className="text-sm text-muted-foreground">Sales</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{product.viewCount}</p>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <div>
                    <p className="text-2xl font-bold">
                      {(product.rating || 0).toFixed(1)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.reviewCount || 0} reviews
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="variants" className="space-y-4">
        <TabsList>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="variants">
          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Different sizes, colors, and materials available for this
                product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variants.map((variant) => (
                    <TableRow key={variant.variantId}>
                      <TableCell className="font-medium">
                        {variant.sku}
                      </TableCell>
                      <TableCell>{variant.size}</TableCell>
                      <TableCell>{variant.color}</TableCell>
                      <TableCell>{variant.material}</TableCell>
                      <TableCell>${variant.price.toFixed(2)}</TableCell>
                      <TableCell>{variant.stock}</TableCell>
                      <TableCell>
                        <Badge
                          variant={variant.isActive ? "default" : "secondary"}
                        >
                          {variant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customization">
          <Card>
            <CardHeader>
              <CardTitle>Customization Options</CardTitle>
              <CardDescription>
                Available customization options for this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product.allowCustomization ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Additional Price</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.customizationOptions.map((option) => (
                      <TableRow key={option.optionId}>
                        <TableCell className="font-medium">
                          {option.name}
                        </TableCell>
                        <TableCell>{option.type}</TableCell>
                        <TableCell>
                          {option.additionalPrice > 0
                            ? `+$${option.additionalPrice.toFixed(2)}`
                            : "Free"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={option.isRequired ? "default" : "outline"}
                          >
                            {option.isRequired ? "Required" : "Optional"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-12 w-12 mx-auto mb-4" />
                  <p>Customization is not available for this product</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>
                Shipping details and dimensions for this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Weight
                  </p>
                  <p className="text-sm">
                    {product.shippingInfo?.weight || 0} lbs
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Length
                  </p>
                  <p className="text-sm">
                    {product.shippingInfo?.dimensions?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Width
                  </p>
                  <p className="text-sm">
                    {product.shippingInfo?.dimensions?.width || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Height
                  </p>
                  <p className="text-sm">
                    {product.shippingInfo?.dimensions?.height || 0}
                  </p>
                </div>
              </div>
              {product.shippingInfo?.shippingClass && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Shipping Class
                  </p>
                  <p className="text-sm">
                    {product.shippingInfo.shippingClass}
                  </p>
                </div>
              )}
              {product.shippingInfo?.handlingTime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Handling Time
                  </p>
                  <p className="text-sm">
                    {product.shippingInfo.handlingTime} business days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Information</CardTitle>
              <CardDescription>
                Search engine optimization settings for this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Meta Title
                </p>
                <p className="text-sm">{product.seo?.metaTitle || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Meta Description
                </p>
                <p className="text-sm">
                  {product.seo?.metaDescription || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  URL Slug
                </p>
                <p className="text-sm">
                  {product.seo?.slug || "Auto-generated"}
                </p>
              </div>
              {product.seo?.metaKeywords &&
                product.seo.metaKeywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Meta Keywords
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {product.seo.metaKeywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
