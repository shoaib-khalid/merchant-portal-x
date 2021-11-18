export interface Discount
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
    created?: string;
    updated?: string;
    discountVariants?: DiscountVariant[]; // Refer Discount Variants Section
    discountInventories?: DiscountInventory[]; // Refer Discount Inventories Section
    discountReviews?: [];
    discountAssets?: DiscountAssets[];
    discountDeliveryDetail?: string;
}

/**
 * 
 * Discount Variants Section
 * 
 */

export interface DiscountVariant
{
    id?: string;
    name: string;
    description?: string;
    discountVariantsAvailable?: DiscountVariantAvailable[];
    sequenceNumber?: number;
}

/**
 * 
 * Discount Inventories Section
 * 
 */
export interface DiscountInventory
{
    itemCode: string;
    price: number;
    quantity: number;
    discountId: string;
    discountInventoryItems?: DiscountInventoryItem[];
    sku: string;
}


export interface DiscountInventoryItem
{
    itemCode: string;
    discountVariantAvailableId: string;
    discountId: string;
    sequenceNumber: number;
    discountVariantAvailable: DiscountVariantAvailable
}

export interface DiscountVariantAvailable
{
    id?: string;
    value: string;
    discountId?: string;
    discountVariantId?: string;
    sequenceNumber?: number;
}

/**
 * 
 * Discount Pagination
 * 
 */

export interface DiscountPagination
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
 * Discount Category
 * 
 */

export interface DiscountCategory
{
id?: string;
storeId: string;
parentCategoryId: string;
name: string;
thumbnailUrl: string;
}

/**
 * 
 *  Discount Assets
 */

export interface DiscountAssets
{
    id: string;
    itemCode: string;
    name: string;
    url: string;
    discountId: string;
    isThumbnail: boolean;
}