export interface InventoryProduct
{
    id: string; 
    thumbnail: string;
    images: string[];
    active: boolean;
    name: string; 
    description?: string; 
    stock: number;
    allowOutOfStockPurchases: boolean;
    minQuantityForAlarm: number;
    trackQuantity: boolean;
    sku?: string | null;
    price: number;
    weight: number;
    category: string;
    variants?: InventoryVariant[];
    variantsTag?: InventoryVariantsAvailable[];
    status?: string;
}

export interface InventoryPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

export interface InventoryCategory
{
    id?: string;
    parentCategoryId?: string;
    name?: string;
    slug?: string;
}

export interface InventoryVariant
{
    id?: string;
    name?: string;
    productVariantsAvailable?: InventoryVariantsAvailable[];
}

export interface InventoryVariantsAvailable
{
    id?: string;
    value?: string;
    productId?: string;
}

// productInventories
export interface InventoryProductX
{
    productId?: string;
    itemCode?: string;
    price?: number;
    compareAtprice?: number;
    quantity?: number;
    sku?: string;
    status?: string;
}

// productInventoryItems
export interface InventoryProductItem
{
    productId?: string;
    itemCode?: string;
    productVariantAvailableId?: string;
    sequenceNumber?: string;
}