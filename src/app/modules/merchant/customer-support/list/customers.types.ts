export interface Customer
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
    customerVariants?: CustomerVariant[]; // Refer Customer Variants Section
    customerInventories?: CustomerInventory[]; // Refer Customer Inventories Section
    customerReviews?: [];
    customerAssets?: CustomerAssets[];
    customerDeliveryDetail?: string;
}

/**
 * 
 * Customer Variants Section
 * 
 */

export interface CustomerVariant
{
    id?: string;
    name: string;
    description?: string;
    customerVariantsAvailable?: CustomerVariantAvailable[];
    sequenceNumber?: number;
}

/**
 * 
 * Customer Inventories Section
 * 
 */
export interface CustomerInventory
{
    itemCode: string;
    price: number;
    quantity: number;
    customerId: string;
    customerInventoryItems?: CustomerInventoryItem[];
    sku: string;
}


export interface CustomerInventoryItem
{
    itemCode: string;
    customerVariantAvailableId: string;
    customerId: string;
    sequenceNumber: number;
    customerVariantAvailable: CustomerVariantAvailable
}

export interface CustomerVariantAvailable
{
    id?: string;
    value: string;
    customerId?: string;
    customerVariantId?: string;
    sequenceNumber?: number;
}

/**
 * 
 * Customer Pagination
 * 
 */

export interface CustomerPagination
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
 * Customer Category
 * 
 */

export interface CustomerCategory
{
id?: string;
storeId: string;
parentCategoryId: string;
name: string;
thumbnailUrl: string;
}

/**
 * 
 *  Customer Assets
 */

export interface CustomerAssets
{
    id: string;
    itemCode: string;
    name: string;
    url: string;
    customerId: string;
    isThumbnail: boolean;
}