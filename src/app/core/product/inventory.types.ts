export interface Product
{
    id: string;
    name: string;
    description: string;
    storeId: string;
    categoryId: string;
    status: string;
    thumbnailUrl?: string;
    vendor?: string;
    region?: string;
    seoUrl: string;
    seoName: string;
    trackQuantity: boolean;
    allowOutOfStockPurchases: boolean;
    minQuantityForAlarm: number;
    packingSize: string;
    isPackage?: boolean;
    created?: string;
    updated?: string;
    productVariants?: ProductVariant[]; // Refer Product Variants Section
    productInventories?: ProductInventory[]; // Refer Product Inventories Section
    productReviews?: [];
    productAssets?: ProductAssets[];
    productDeliveryDetail?: string;
}

/**
 * 
 * Product Variants Section
 * 
 */

export interface ProductVariant
{
    id?: string;
    name: string;
    description?: string;
    productVariantsAvailable?: ProductVariantAvailable[];
    sequenceNumber?: number;
}

/**
 * 
 * Product Inventories Section
 * 
 */
export interface ProductInventory
{
    itemCode: string;
    price: number;
    quantity: number;
    productId: string;
    productInventoryItems?: ProductInventoryItem[];
    sku: string;
}


export interface ProductInventoryItem
{
    itemCode: string;
    productVariantAvailableId: string;
    productId: string;
    sequenceNumber: number;
    productVariantAvailable: ProductVariantAvailable
}

export interface ProductVariantAvailable
{
    id?: string;
    value: string;
    productId?: string;
    productVariantId?: string;
    sequenceNumber?: number;
}

/**
 * 
 * Product Pagination
 * 
 */

export interface ProductPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}


/**
 * 
 * Product Category
 * 
 */

export interface ProductCategory
{
id?: string;
storeId: string;
parentCategoryId: string;
name: string;
thumbnailUrl: string;
}

/**
 * 
 *  Product Assets
 */

export interface ProductAssets
{
    id: string;
    itemCode: string;
    name: string;
    url: string;
    productId: string;
    isThumbnail: boolean;
}


/**
 * 
 * Product Package Option Section
 * 
 */

 export interface ProductPackageOption
 {
     id?: string;
     packageId: string;
     title: string;
     totalAllow: number;
     productPackageOptionDetail: ProductPackageOptionDetail[];
 }
 
 export interface ProductPackageOptionDetail 
 {
     id?: string;
     productPackageOptionId: string;
     productId: string;
 }
 