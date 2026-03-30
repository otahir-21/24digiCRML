"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { braceletProductService } from "@/lib/services/bracelet-product.service";

interface BraceletProduct {
  productId: string;
  name_en: string;
  name_ar?: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number;
  stock: number;
  salesCount: number;
  isActive: boolean;
  isFeatured: boolean;
  onSale: boolean;
  rating: number;
  reviewCount: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export default function BraceletProductsPage() {
  const [products, setProducts] = useState<BraceletProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        isActive:
          statusFilter === "active"
            ? true
            : statusFilter === "inactive"
            ? false
            : undefined,
        isFeatured: statusFilter === "featured" ? true : undefined,
        onSale: statusFilter === "on-sale" ? true : undefined,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc",
      };

      const response = await braceletProductService.getProducts(filters);

      // Transform the response to match our interface
      const transformedProducts = response.products.map((product) => ({
        productId: product.productId,
        name_en: product.name_en || product.name || "",
        name_ar: product.name_ar,
        name: product.name_en || product.name || "",
        sku: product.variants?.[0]?.sku || "N/A",
        category: product.category,
        brand: product.brand,
        price: product.basePrice,
        salePrice: product.salePrice,
        stock: product.totalStock,
        salesCount: product.salesCount,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        onSale: product.onSale,
        rating: product.rating,
        reviewCount: product.reviewCount,
        images: product.images?.map((img) => img.url) || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));

      setProducts(transformedProducts);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Fallback to empty array on error
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getStockStatus = (stock: number) => {
    if (stock === 0)
      return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= 10)
      return { label: "Low Stock", variant: "secondary" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await braceletProductService.deleteProduct(productToDelete);
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const openDeleteDialog = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = product.isActive;
    if (statusFilter === "inactive") matchesStatus = !product.isActive;
    if (statusFilter === "featured") matchesStatus = product.isFeatured;
    if (statusFilter === "on-sale") matchesStatus = product.onSale;
    if (statusFilter === "low-stock")
      matchesStatus = product.stock <= 10 && product.stock > 0;
    if (statusFilter === "out-of-stock") matchesStatus = product.stock === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bracelet Products
          </h1>
          <p className="text-muted-foreground">
            Manage your bracelet product catalog and inventory
          </p>
        </div>
        <Link href="/dashboard/bracelets/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
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
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="on-sale">On Sale</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [field, order] = value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                  <SelectItem value="salesCount-desc">Best Selling</SelectItem>
                  <SelectItem value="stock-asc">Low Stock First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Products ({filteredProducts.length})</span>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product (EN)</TableHead>
                <TableHead>Product (AR)</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name_en}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name_en}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.name_ar || (
                        <span className="text-muted-foreground">
                          Not provided
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {product.onSale && product.salePrice ? (
                          <>
                            <span className="font-medium text-green-600">
                              ${product.salePrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{product.stock}</span>
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{product.salesCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{product.rating}</span>
                        <span className="text-muted-foreground">
                          ({product.reviewCount})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {product.isFeatured && (
                          <Badge variant="outline" className="text-purple-600">
                            Featured
                          </Badge>
                        )}
                        {product.onSale && (
                          <Badge variant="outline" className="text-green-600">
                            Sale
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/bracelets/products/${product.productId}`}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/bracelets/products/${product.productId}/edit`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(product.productId)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
