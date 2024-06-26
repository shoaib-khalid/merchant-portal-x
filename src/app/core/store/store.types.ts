export interface StoreCategory
{
    id?: string;
    name?: string;
    slug?: string[];
}

export interface Store
{
    id: string;
    name: string;
    storeDescription?: string;
    storeLogo: string;
    slug?: string;
    domain?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    postcode?: string;
    regionCountryStateId?: string;
    paymentType?: string;
    city?: string;
    verticalCode?: string;
    category?: string;
    storeTiming?: {
        day?: string;
        openTime?: string;
        closeTime?: string;
        isOff?: boolean;
    }[];
    type?: string;
    totalSteps?: number;
    updatedAt?: number;
    progress?: {
        currentStep?: number;
        completed?: number;
    };
    duration?: number;
    featured?: boolean;
    completed?: number;
    currentStep?: number;
    storeAsset?: StoreAssets;
    storeAssets?: StoreAsset[];
    regionCountry?: {
        currency?: string;
        currencyCode: string;
        currencySymbol: string;
        id: string;
        name: string;
        region: string;
        timezone: string;
    }
    latitude: string;
    longitude: string;
    isDelivery: boolean;
    isDineIn: boolean;
    dineInOption: string;
    dineInPaymentType: string;
    regionCountryId?: string;
    storePrefix: string;
}

export interface CreateStore
{
    address: string;
    city: string;
    clientId: string;
    domain: string;
    email: string;
    id?: string;
    isBranch: true;
    isSnooze: true;
    latitude: string;
    liveChatCsrGroupId?: string;
    liveChatCsrGroupName?: string;
    liveChatOrdersGroupId?: string;
    liveChatOrdersGroupName?: string;
    longitude?: string;
    name: string;
    paymentType: string;
    phoneNumber: string;
    postcode: string;
    regionCountryId: string;
    regionCountryStateId: string;
    serviceChargesPercentage: number;
    snoozeEndTime?: string;
    snoozeReason?: string;
    storeDescription: string;
    verticalCode: string;
}

export interface StoreTiming
{
    closeTime: string;
    day: string;
    isOff: boolean;
    openTime: string;
    breakEndTime: string,
    breakStartTime: string,
}

export interface StoreRegionCountries
{
    id: string;
    name: string;
    region: string;
    currency: string;
    currencyCode: string;
    currencySymbol: string;
    timezone: string;
    countryCode?: string; // need taufik to add in backend
}


export interface StoreDeliveryProvider
{
    deliveryType?: string;
    deliverySpId?: string;
    deliverySpTypeId?: number;
    fulfilment?: string;
    id?: string;
    regionCountry?: string;
    storeDeliveryServiceProvider?: {
        name?: string;
        address?: string;
        contactNo?: string;
        contactPerson?: string;
        getPriceClassname?: string;
        submitOrderClassName?: string;
        cancelOrderClassName?: string;
        queryOrderClassName?: string;
        spCallbackClassname?: string;
        pickupDateClassname?: string;
        pickupTimeClassname?: string;
        locationIdClassname?: string;
        providerImage?: string;
        regionCountryId: string;
    }
    
}

export interface StoreDeliveryDetails
{
    allowsStorePickup: boolean;
    itemType: string;
    maxOrderQuantityForBike: number;
    storeId: string;
    type: string;
}

export interface StoreSelfDeliveryStateCharges
{
    id?: string;
    delivery_charges: number;
    region_country_state_id: string;
    storeId?: string;
}

export interface StoreAssets
{
    bannerMobileUrl?: string;
    bannerUrl?: string;
    logoUrl?: string;
    storeId?: string;
}

export interface StoreAsset
{
    assetDescription: string;
    assetFile: string;
    assetType: string;
    assetUrl: string;
    id: string;
    storeId: string;
}

export interface StorePagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

export interface StoreDeliveryPeriod
{
    id: string;
    deliveryPeriod: string;
    description: string;
    storeId: string;
    enabled: boolean;

    // reka sendiri
    deliveryProviders: StoreDeliveryProvider[];
}