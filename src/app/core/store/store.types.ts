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

export interface StoreRegionCountries
{
    id: string;
    name: string;
    region: string;
    currency: string;
    currencyCode: string;
    currencySymbol: string;
    timezone: string;
}