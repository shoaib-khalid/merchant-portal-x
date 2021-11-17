export interface DailyTopProducts
{
    date: string;
    topProduct: TopProducts[];
}

export interface TopProducts
{
    productName: string;
    totalTransaction: number;
    rank: number;
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
    date: string;
    sales: DetailedSale[];
}

export interface DetailedSale
{
    storeId: string;
    merchantName: string;
    storeName: string;
    subTotal: number;
    total: number;
    serviceCharge: number;
    deliveryCharge: number;
    customerName: string;
    orderStatus: string;
    deliveryStatus: string;
    commission: number;
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
    date: string;
    storeId: string;
    totalOrders: number;
    successFullOrders: string;
    canceledOrders: string;
    amountEarned: number;
    commision: number;
    totalServiceCharge: number;
    totalAmount: number;
    totalDeliveryFee: number;
    store: {
      id: string;
      name: string;
      address: string;
      city: string;
      postcode: string;
      state: string;
      email: string;
      phone: string;
      verticalCode: string;
      regionCountryId: string;
      clientId: string;
      nameAbreviation: string;
    },
    settlementReferenceId: string;
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