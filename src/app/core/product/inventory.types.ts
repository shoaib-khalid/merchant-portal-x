export interface InventoryProduct
{
    id: string; 
    category?: string;
    name: string; 
    description?: string; 
    variants?: InventoryVariant[];
    sku?: string | null;
    stock: number;
    taxPercent: number;
    price: number;
    weight: number;
    thumbnail: string;
    images: string[];
    allowOutOfStockPurchases: boolean;
    trackQuantity: boolean;
    active: boolean;
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