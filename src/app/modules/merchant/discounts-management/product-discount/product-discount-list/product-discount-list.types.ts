export interface StoreDiscountProduct
{
    id?: string;
    categoryId?: string;
    itemCode?: string;
    storeDiscountId: string;
    dineInDiscountAmount?: number;
    discountAmount?: number;
    dineIncalculationType?: string;
    calculationType?: string;
}

export interface StoreDiscountProductPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

// export interface ApiResponseModel<T>
// {

//   message?: string;
//   data?: T[];
//   path : string;
//   status: number;
//   timestamp:string;
// }

