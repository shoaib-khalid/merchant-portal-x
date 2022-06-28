import { Store } from "../store/store.types";

export interface CustomerCart
{
    cartList: Cart[];
    totalItem: number;
}

export interface Cart
{
    id?: string;
    customerId: string;
    storeId: string;
    created?: string;
    updated?: string;
    store?: Store;
}

export interface CartById
{
    id?                 : string;
    customerId?         : string;
    storeId?            : string;
    storeVoucherCode    : string;
    deliveryQuotationId : string;
    deliveryType        : string;
    created             : string;
    updated             : string;
    store               : Store;
    isOpen              : boolean;
    stage               : string;
}

export interface CartItem
{
    id?: string;
    quantity: number;
    cartId: string;
    productId: string;
    itemCode: string;
    price?: number;
    productPrice?: number;
    weight?: string;
    productName?: string;
    specialInstruction?: string;
    discountId?: string;
    normalPrice?: null,
    discountLabel?: string;
    discountCalculationType?: string;
    discountCalculationValue?: null,
    cartSubItem?: [];
    productInventory?: ProductInventory;
    productAsset?: {
        id: string;
        isThumbnail: boolean;
        itemCode: string;
        name: string;
        productId: string;
        url: string;
    }
    SKU?: string;
}

export interface ProductInventory
{
    itemCode: string;
    price: number;
    compareAtprice: number;
    quantity: number;
    product: Product;
    productInventoryItems: [],
    sku: string;
}

export interface Product
{
    id: string;
    name: string;
    storeId: string;
    categoryId: string;
    thumbnailUrl: string;
    vendor: string;
    description: string;
    region: string;
    seoUrl: string;
    trackQuantity: boolean;
    allowOutOfStockPurchases: boolean;
    minQuantityForAlarm: number;
    isPackage: boolean;
    status: string;
}