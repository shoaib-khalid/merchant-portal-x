export interface Order
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
    invoiceId: string;
    klCommission: number;
    storeServiceCharges: number;
    storeShare: number;
    paymentType: string;
    appliedDiscount: number;
    deliveryDiscount: number;
    deliveryType: string;
    appliedDiscountDescription: string;
    deliveryDiscountDescription: string;
    orderShipmentDetail: {
      receiverName: string;
      phoneNumber: string;
      address: string;
      city: string;
      zipcode: number;
      email: string;
      deliveryProviderId: number;
      state: string;
      country: string;
      trackingUrl: string;
      orderId: string;
      storePickup: boolean,
      merchantTrackingUrl: string;
      customerTrackingUrl: string;
      trackingNumber: string;
    };
    orderPaymentDetail: {
      accountName: string;
      gatewayId: string;
      couponId: string;
      time: string;
      orderId: string;
      deliveryQuotationReferenceId: string;
      deliveryQuotationAmount: number;
    };
    store: {
      id: string;
      name: string;
      city: string;
      address: string;
      clientId: string;
      postcode: number;
      state: string;
      contactName: string;
      phone: string;
      phoneNumber: string;
      email: string;
      verticalCode: string;
      serviceChargesPercentage: number;
      paymentType: string;
      invoiceSeqNo: number;
      nameAbreviation: string;
    };
    orderGroupDetails: OrderGroupDetails;
    storeVoucherDiscount: number;

}

export interface OrderGroupDetails
{
  platformVoucherDiscount: number;
  platformVoucherId: string;
  total: number;
}

export interface OrderItem
{
  id: string;
  orderId: string;
  productId: string;
  price: number;
  productPrice: number;
  weight: string;
  quantity: number;
  itemCode: string;
  productName: string;
  specialInstruction: string;
  productVariant: string;
  SKU: string;
}

export interface OrdersListPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

export interface OrdersCountSummary
{
  label?: string;
  completionStatus: string;
  count: number;
}

export interface DeliveryProviderDetails
{
  id: string;
  name: string;
  providerImage: string;
  dialog: boolean;
  scheduleDate: boolean;
}

export interface DeliveryRiderDetails
{
  name: string;
  phoneNumber: string;
  plateNumber: string;
  trackingUrl: string;
  orderNumber: string;
  provider: {
    id : number;
    name : string;
    providerImage : string;
  }
  airwayBill: string;
}

export interface Voucher
{
    id                : string;
    name              : string;
    storeId           : string;
    discountValue     : number;
    maxDiscountAmount : number;
    voucherCode       : string;
    totalQuantity     : number;
    totalRedeem       : number;
    status            : string;
    voucherType       : string;
    discountType      : string;
    calculationType   : string;
    startDate         : string;
    endDate           : string;
    isNewUserVoucher  : boolean;
    voucherVerticalList : VoucherVerticalList[];

}

export interface VoucherVerticalList
{
    id: string;
    regionVertical: {
        code: string;
        commissionPercentage: number;
        customerActivationNotice: string;
        defaultLogoUrl: string;
        description: string;
        domain: string;
        minChargeAmount: number;
        name: string;
        regionId: string;
        senderEmailAdress: string;
        senderEmailName: string;
        thumbnailUrl: string;
    };
    verticalCode: string;
    voucherId: string;
}