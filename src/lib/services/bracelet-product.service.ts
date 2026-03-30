import apiClient from '../api-client';

export interface ProductVariant {
  variantId: string;
  size: string;
  color: string;
  material: string;
  price: number;
  sku: string;
  stock: number;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
}

export interface ProductImage {
  imageId: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductSpecification {
  label_en: string;
  label_ar?: string;
  value_en: string;
  value_ar?: string;
  label?: string; // legacy
  value?: string; // legacy
  icon: string;
}

export enum ProductType {
  PERFORMANCE = 'performance',
  SAFE_LIFE = 'safe-life'
}

export interface MaterialInfo {
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  careInstructions_en?: string;
  careInstructions_ar?: string;
  name?: string; // legacy
  description?: string; // legacy
  careInstructions?: string; // legacy
  isHypoallergenic?: boolean;
}

export interface CustomizationOption {
  optionId: string;
  name_en: string;
  name_ar?: string;
  name?: string; // legacy
  type: 'text' | 'selection' | 'color';
  additionalPrice: number;
  maxLength?: number;
  options?: string[];
  isRequired: boolean;
}

export interface ProductSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  slug?: string;
}

export interface ShippingInfo {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  shippingClass?: string;
  handlingTime?: number;
}

export interface BraceletProduct {
  _id?: string;
  productId: string;
  name_en: string;
  name_ar?: string;
  name?: string; // legacy
  description_en: string;
  description_ar?: string;
  description?: string; // legacy
  shortDescription_en?: string;
  shortDescription_ar?: string;
  shortDescription?: string; // legacy
  brand: string;
  type: ProductType;
  category: string;
  subcategory?: string;
  gender: string;
  style: string;
  collection?: string;

  // Pricing
  basePrice: number;
  originalPrice?: number;
  salePrice?: number;
  currency: string;
  onSale: boolean;
  saleStartDate?: Date;
  saleEndDate?: Date;

  // Variants and Stock
  variants: ProductVariant[];
  totalStock: number;
  lowStockThreshold: number;

  // Media
  images: ProductImage[];
  videos?: string[];

  // Product Details
  specifications?: ProductSpecification[];
  features: string[];
  materials: MaterialInfo[];
  careInstructions?: string[];
  warranty?: string;

  // Customization
  allowCustomization: boolean;
  customizationOptions: CustomizationOption[];

  // Status and Visibility
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  isLimitedEdition: boolean;
  inStock: boolean;

  // SEO and Marketing
  tags: string[];
  seo: ProductSEO;

  // Sales and Analytics
  salesCount: number;
  viewCount: number;
  rating: number;
  reviewCount: number;

  // Shipping
  shippingInfo: ShippingInfo;

  // Admin fields
  vendor?: string;
  costPrice?: number;
  profitMargin?: number;
  internalNotes?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CreateBraceletProductDto {
  name_en: string;
  name_ar?: string;
  name?: string; // legacy
  description_en: string;
  description_ar?: string;
  description?: string; // legacy
  shortDescription_en?: string;
  shortDescription_ar?: string;
  shortDescription?: string; // legacy
  brand: string;
  category: string;
  subcategory?: string;
  gender: string;
  style: string;
  collection?: string;
  basePrice: number;
  salePrice?: number;
  currency?: string;
  onSale?: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  variants: Omit<ProductVariant, 'variantId'>[];
  lowStockThreshold?: number;
  images?: Omit<ProductImage, 'imageId'>[];
  videos?: string[];
  specifications?: ProductSpecification[];
  materials: MaterialInfo[];
  features: string[];
  careInstructions?: string[];
  warranty?: string;
  allowCustomization?: boolean;
  customizationOptions?: Omit<CustomizationOption, 'optionId'>[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isLimitedEdition?: boolean;
  tags?: string[];
  seo?: ProductSEO;
  shippingInfo: Omit<ShippingInfo, ''>;
  vendor?: string;
  costPrice?: number;
  profitMargin?: number;
  internalNotes?: string;
}

export interface UpdateBraceletProductDto {
  name_en?: string;
  name_ar?: string;
  name?: string; // legacy
  description_en?: string;
  description_ar?: string;
  description?: string; // legacy
  shortDescription_en?: string;
  shortDescription_ar?: string;
  shortDescription?: string; // legacy
  brand?: string;
  category?: string;
  subcategory?: string;
  gender?: string;
  style?: string;
  collection?: string;
  type?: ProductType;
  originalPrice?: number;
  specifications?: ProductSpecification[];
  basePrice?: number;
  salePrice?: number;
  currency?: string;
  onSale?: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  variants?: ProductVariant[];
  lowStockThreshold?: number;
  images?: ProductImage[];
  videos?: string[];
  materials?: MaterialInfo[];
  features?: string[];
  careInstructions?: string[];
  warranty?: string;
  allowCustomization?: boolean;
  customizationOptions?: CustomizationOption[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isLimitedEdition?: boolean;
  inStock?: boolean;
  tags?: string[];
  seo?: ProductSEO;
  shippingInfo?: ShippingInfo;
  vendor?: string;
  costPrice?: number;
  profitMargin?: number;
  internalNotes?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  onSale?: boolean;
  gender?: string;
  style?: string;
  tags?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: BraceletProduct[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RelatedProduct {
  productId: string;
  name: string;
  images: string[];
  basePrice: number;
  salePrice?: number;
  rating: number;
  isActive: boolean;
}

class BraceletProductService {
  private baseUrl = '/v1/bracelet-products';

  // Transform backend response to match frontend interface
  private transformProduct(backendProduct: Record<string, unknown>): BraceletProduct {
    return {
      ...backendProduct,
      // Ensure new fields are properly handled
      type: (backendProduct.type as ProductType) || ProductType.PERFORMANCE,
      originalPrice: typeof backendProduct.originalPrice === 'number' ? backendProduct.originalPrice : 0,
      specifications: Array.isArray(backendProduct.specifications) ? backendProduct.specifications : [],
      inStock: typeof backendProduct.inStock === 'boolean' ? backendProduct.inStock : true,
      // Ensure shippingInfo is properly structured
      shippingInfo: {
        weight: typeof backendProduct.weight === 'number' ? backendProduct.weight : 0,
        dimensions: {
          length: typeof backendProduct.length === 'number' ? backendProduct.length : 0,
          width: typeof backendProduct.width === 'number' ? backendProduct.width : 0,
          height: typeof backendProduct.height === 'number' ? backendProduct.height : 0,
        },
        shippingClass: typeof backendProduct.shippingClass === 'string' ? backendProduct.shippingClass : undefined,
        handlingTime: typeof backendProduct.handlingTime === 'number' ? backendProduct.handlingTime : 1,
      },
      // Ensure seo is properly structured
      seo: backendProduct.seo || {},
      // Ensure arrays are defined and properly transform materials
      materials: (Array.isArray(backendProduct.materials) ? backendProduct.materials : []).map((material: string | MaterialInfo) =>
        typeof material === 'string'
          ? { name_en: material, name: material } // Convert string to MaterialInfo for legacy data
          : material // Keep MaterialInfo object as is
      ),
      features: Array.isArray(backendProduct.features) ? backendProduct.features : [],
      careInstructions: Array.isArray(backendProduct.careInstructions) ? backendProduct.careInstructions : [],
      tags: Array.isArray(backendProduct.tags) ? backendProduct.tags : [],
      variants: Array.isArray(backendProduct.variants) ? backendProduct.variants : [],
      images: Array.isArray(backendProduct.images) ? backendProduct.images : [],
      customizationOptions: Array.isArray(backendProduct.customizationOptions) ? backendProduct.customizationOptions : [],
      // Ensure numeric fields have defaults
      rating: typeof backendProduct.rating === 'number' ? backendProduct.rating : 0,
      reviewCount: typeof backendProduct.reviewCount === 'number' ? backendProduct.reviewCount : 0,
      salesCount: typeof backendProduct.salesCount === 'number' ? backendProduct.salesCount : 0,
      viewCount: typeof backendProduct.viewCount === 'number' ? backendProduct.viewCount : 0,
    } as BraceletProduct;
  }

  // Transform array of products
  private transformProducts(backendProducts: Record<string, unknown>[]): BraceletProduct[] {
    return backendProducts.map(product => this.transformProduct(product));
  }

  // Get all products with filters
  async getProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`${this.baseUrl}?${params.toString()}`);
    return response.data;
  }

  // Get single product by ID
  async getProduct(productId: string): Promise<BraceletProduct> {
    const response = await apiClient.get(`${this.baseUrl}/${productId}`);
    return this.transformProduct(response.data);
  }

  // Create new product
  async createProduct(productData: CreateBraceletProductDto): Promise<BraceletProduct> {
    const response = await apiClient.post(this.baseUrl, productData);
    return this.transformProduct(response.data);
  }

  // Update product
  async updateProduct(productId: string, productData: UpdateBraceletProductDto): Promise<BraceletProduct> {
    // Materials are now MaterialInfo[] objects with bilingual fields
    const response = await apiClient.put(`${this.baseUrl}/${productId}`, productData);
    return this.transformProduct(response.data);
  }

  // Delete product (soft delete)
  async deleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${productId}`);
  }

  // Hard delete product
  async hardDeleteProduct(productId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${productId}/hard`);
  }

  // Get featured products
  async getFeaturedProducts(limit?: number): Promise<BraceletProduct[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`${this.baseUrl}/featured${params}`);
    return this.transformProducts(response.data);
  }

  // Get related products
  async getRelatedProducts(productId: string, limit?: number): Promise<RelatedProduct[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`${this.baseUrl}/${productId}/related${params}`);
    return response.data;
  }

  // Get new arrivals
  async getNewArrivals(limit?: number): Promise<BraceletProduct[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`${this.baseUrl}/new-arrivals${params}`);
    return this.transformProducts(response.data);
  }

  // Get bestsellers
  async getBestsellers(limit?: number): Promise<BraceletProduct[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`${this.baseUrl}/bestsellers${params}`);
    return this.transformProducts(response.data);
  }

  // Get products on sale
  async getProductsOnSale(limit?: number): Promise<BraceletProduct[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`${this.baseUrl}/on-sale${params}`);
    return this.transformProducts(response.data);
  }

  // Search products
  async searchProducts(query: string, filters?: Omit<ProductFilters, 'search'>): Promise<ProductListResponse> {
    const params = new URLSearchParams();
    params.append('search', query);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`${this.baseUrl}/search?${params.toString()}`);
    return response.data;
  }

  // Update product sales count
  async updateSalesCount(productId: string, quantity: number): Promise<void> {
    await apiClient.put(`${this.baseUrl}/${productId}/sales-count`, { quantity });
  }

  // Update product rating
  async updateRating(productId: string, rating: number, reviewCount: number): Promise<void> {
    await apiClient.put(`${this.baseUrl}/${productId}/rating`, { rating, reviewCount });
  }

  // Toggle product status
  async toggleProductStatus(productId: string): Promise<BraceletProduct> {
    const response = await apiClient.put(`${this.baseUrl}/${productId}/toggle-status`);
    return this.transformProduct(response.data);
  }

  // Get product analytics
  async getProductAnalytics(productId: string): Promise<{
    views: number;
    sales: number;
    revenue: number;
    conversionRate: number;
    averageRating: number;
    totalReviews: number;
  }> {
    const response = await apiClient.get(`${this.baseUrl}/${productId}/analytics`);
    return response.data;
  }

  // Bulk update products
  async bulkUpdate(productIds: string[], updates: Partial<UpdateBraceletProductDto>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    const response = await apiClient.put(`${this.baseUrl}/bulk-update`, {
      productIds,
      updates,
    });
    return response.data;
  }

  // Duplicate product
  async duplicateProduct(productId: string, newName?: string): Promise<BraceletProduct> {
    const response = await apiClient.post(`${this.baseUrl}/${productId}/duplicate`, {
      newName,
    });
    return this.transformProduct(response.data);
  }

  // Upload product images
  async uploadImages(productId: string, files: File[]): Promise<ProductImage[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await apiClient.post(`${this.baseUrl}/${productId}/upload-images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Remove product image
  async removeImage(productId: string, imageId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${productId}/images/${imageId}`);
  }

  // Set primary image
  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    await apiClient.put(`${this.baseUrl}/${productId}/images/${imageId}/primary`);
  }

  // Get product categories
  async getCategories(): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/categories`);
    return response.data;
  }

  // Get product brands
  async getBrands(): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/brands`);
    return response.data;
  }

  // Get product materials
  async getMaterials(): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/materials`);
    return response.data;
  }

  // Export products to CSV
  async exportToCSV(filters?: ProductFilters): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(`${this.baseUrl}/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const braceletProductService = new BraceletProductService();