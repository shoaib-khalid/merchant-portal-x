export interface StoreDiscountProduct
{
    id?: string;
    categoryId?: string;
    itemCode?: string;
    storeDiscountId: string;

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

