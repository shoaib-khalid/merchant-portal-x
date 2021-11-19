export interface FlowBuilder
{
    id: string;
    storeId: string;
    subTotal: number;
    deliveryCharges: number;
    total: number;
    completionStatus: string;
    paymentStatus: string;
    customerNotes: string;
    privateAdminNotes: string;
    cartId: string;
    customerId: string;
    created: string;
    updated: string;
}

export interface FlowBuilderPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}