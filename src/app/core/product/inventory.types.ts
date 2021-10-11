export interface InventoryProduct
{
    id: string; 
    category?: string;
    name: string; 
    description?: string; 
    variants?: InventoryVariant[];
    sku?: string | null;
    barcode?: string | null;
    brand?: string | null;
    vendor: string | null;
    stock: number;
    reserved: number;
    cost: number;
    basePrice: number;
    taxPercent: number;
    price: number;
    weight: number;
    thumbnail: string;
    images: string[];
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

export interface InventoryBrand
{
    id: string;
    name: string;
    slug: string;
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

export interface InventoryVendor
{
    id: string;
    name: string;
    slug: string;
}
