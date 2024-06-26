export interface Product
{
    product?: ProductInventory;
    id?: string;
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
    customNote?: string;
    isNoteOptional?: boolean;
    hasAddOn: boolean;
    sequenceNumber?: number;
    isCustomPrice?: boolean;
    isVariants?: boolean;
    isBulkItem?: boolean;
    vehicleType?: string;
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
    status: string;
    dineInPrice: number;
    barcode: string;
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
    variantName?: string;
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
    parentCategoryId?: string;
    name: string;
    thumbnailUrl: string;
    verticalCode?: string;
    displaySequence?: number;
    sequenceNumber?: number;

}

export interface ParentCategory
{
    id?: string;
    storeId: string;
    parentCategoryId?: string;
    name: string;
    thumbnailUrl: string;
    verticalCode?: string;
    displaySequence: number;

}

/**
 * 
 * Product Category Pagination
 * 
 */

 export interface ProductCategoryPagination
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
 *  Product Assets
 */

export interface ProductAssets
{
    id?: string;
    itemCode?: string;
    name?: string;
    url?: string;
    productId?: string;
    isThumbnail?: boolean;
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
    totalAllow: number; //max allowed
    productPackageOptionDetail: ProductPackageOptionDetail[];
    sequenceNumber: number;
    minAllow: number;
    allowSameItem: boolean;
 }
 
 export interface ProductPackageOptionDetail 
 {
     id?: string;
     productId?: string;
     product?: Product;
     productPackageOptionId?: string;
     sequenceNumber: number
     
 }
 
/**
 * Delivery Service Section
 * 
 */
export interface DeliveryVehicleType 
{
    vehicleType?: string;
    name?: string;      
}

export interface ApiResponseModel<T>
{

  message?: string;
  data?: T;
  path : string;
  status: number;
  timestamp:string;
}

//---------------- 
// ADD ON SECTION
//----------------

export interface AddOnGroupTemplate
{
    id?     : string;
    storeId : string;
    title   : string;
    addOnTemplateItem? : AddOnItemTemplate[]

}

export interface AddOnItemTemplate
{
    dineInPrice : number;
    groupId     : string;
    id          : string;
    name        : string;
    price       : number;

}

export interface AddOnItemProduct
{
    addonTemplateItemId : string;
    dineInPrice         : number;
    id                  : string;
    price               : number;
    productId           : string;
    sequenceNumber      : number;
    status              : string;
    name                : string;
    productAddonGroupId : string;
}

export interface AddOnGroupProduct
{
    addonTemplateGroupId : string;
    id?                  : string;
    maxAllowed           : number;
    minAllowed           : number;
    productId            : string;
    sequenceNumber       : number;
}

export interface AddOnProduct
{
    id?     : string;
    title   : string;
    productAddOnItemDetail? : AddOnItemProduct[];
    maxAllowed  : number;
    minAllowed  : number;
    sequenceNumber : number;
    groupId?     : string;
}
