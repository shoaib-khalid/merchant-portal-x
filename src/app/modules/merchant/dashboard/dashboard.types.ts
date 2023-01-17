import { getSupportedInputTypes } from "@angular/cdk/platform"

export interface DailyTopProducts
{
    date: string;
    name: string;
    productId: string;
    storeId: string;
    totalOrders: number;
    ranking: string;
}

export interface DailyTopProductsPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}


////


export interface DetailedDailySales
{
    deliveryType: string;
    cartId: string;
    completionStatus: string;
    created: string;
    customer: {
        id: string;
        name: string;
    }
    customerNotes: {
        id: string;
        paymentStatus: string;
        privateAdminNotes: string;
    }
    store: {
        id: string;
        name: string;
        clientId: string;
        nameAbreviation: string;
    }
    subTotal: number;
    total: number;
    appliedDiscount: number;
    klCommission: number;
    deliveryCharges: number;
    deliveryDiscount: number;
    storeServiceCharges: number;
    storeShare: number;
    serviceType: string;
}

export interface DetailedDailySalesPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}


////

export interface SummarySales
{
    amountEarned: number;
    canceledOrders: string;
    commision: number;
    date: string;
    settlementReferenceId: string;
    store: {
        id: string;
        name: string;
        clientId: string;
        nameAbreviation: string;
    }
    storeId: string;
    successFullOrders: string;
    totalAmount: number;
    totalDeliveryFee: number;
    totalOrders: number;
    totalServiceCharge: number;
}

export interface SummarySalesPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

////

export interface TotalSalesDaily
{
    total: number;
    completionStatus: string;
}

export interface TotalSalesWeekly
{
    total: number;
    completionStatus: string;
}

export interface TotalSalesMonthly
{
    total: number;
    completionStatus: string;
}

export interface TotalSalesTotal
{
    total: number;
    completionStatus: string;
}

export interface WeeklySale
{
    total: number;
    completionStatus: string;
}
////

export interface WeeklyGraph
{
    date: string;
    total: number;
    completionStatus: string;
}

////

export interface Settlement
{
    id: string;
    cycle: number;
    storeId: string;
    clientId: string;
    clientName: string;
    storeName: string;
    totalTransactionValue: number;
    totalServiceFee: number;
    totalCommisionFee: number;
    totalDeliveryFee: number;
    totalRefund: number;
    totalStoreShare: number;
    settlementStatus: string;
    cycleStartDate: string;
    cycleEndDate: string;
    settlementDate: string;
    referenceId: string;
    totalSelfDeliveryFee: number;
}

export interface SettlementPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

export interface StaffSales
{
    staff               : Staff;
    dailyCount          : Count;
    weeklyCount         : Count;
    monthlyCount        : Count;
    previousMonthlyCount: Count;
    previousWeeklyCount : Count;
}

export interface Staff
{
    id                  : string;
    name                : string;
    storeId             : string;
}

export interface Count
{
    date?               : string;
    weekNo              : number;
    month?              : string;
    total               : number;
    previousWeekNo      : number;
}
export interface StaffSalesPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
