export interface Discount
{
    discountName: string;
    discountType: string;
    endDate: string;
    endTime: string;
    id?: string;
    isActive: boolean;
    maxDiscountAmount: string;
    normalPriceItemOnly: boolean;
    startDate: string;
    startTime: string;
    storeDiscountTierList?: StoreDiscountTierList[];
    storeId: string;
}

export interface StoreDiscountTierList {
    calculationType: string;
    discountAmount: number;
    id?: string;
    startTotalSalesAmount: number;
    storeDiscountId?: string;
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