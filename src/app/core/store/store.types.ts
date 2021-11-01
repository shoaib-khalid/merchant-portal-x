export interface StoreCategory
{
    id?: string;
    name?: string;
    slug?: string;
}

export interface Store
{
    id: string;
    name: string;
    storeDescription?: string;
    slug?: string;
    domain?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    verticalCode?: string;
    category?: string;
    storeTiming?: {
        day?: string;
        openTime?: string;
        closeTime?: string;
        isOff?: boolean;
    };
    type?: string;
    totalSteps?: number;
    updatedAt?: number;
    progress?: {
        currentStep?: number;
        completed?: number;
    };
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