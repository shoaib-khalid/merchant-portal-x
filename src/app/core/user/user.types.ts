import { UserRole } from "./user.roles";

export interface Client
{
    id: string;
    username: string;
    name: string;
    regionCountry?: RegionCountry;
    email: string;
    avatar?: string;
    status?: string;
    role: UserRole
    locked: string;
    deactivated: string;
    countryId?: string;
    created: string;
    updated: string;
    roleId: string;
}

export interface RegionCountry
{
    id?: string;
    name?: string;
    region?: string;
}

export interface ClientPaymentDetails
{
    id?: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountTitle: string;
    clientId?: string;
    created?: string;
    updated?: string;
    docImage?: string,
    gstRate?: string,
    stRate?: string,
    taxNumber?: string
    whtRate?: string
    ansurApiKey?: string
    ansurMerchantId?: string
}

export interface ClientPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}
