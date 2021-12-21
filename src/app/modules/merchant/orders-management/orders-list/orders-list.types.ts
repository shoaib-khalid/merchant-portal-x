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
    },
    orderPaymentDetail: {
      accountName: string;
      gatewayId: string;
      couponId: string;
      time: string;
      orderId: string;
      deliveryQuotationReferenceId: string;
      deliveryQuotationAmount: number;
    },
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
    }
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
}