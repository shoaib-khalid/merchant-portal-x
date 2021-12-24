export interface Client
{
    id: string;
    username: string;
    name: string;
    email: string;
    locked: string;
    deactivated: string;
    created: string;
    updated: string;
    roleId: string;
}

export interface ClientPaymentDetails
{
    id?: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountTitle?: string;
    clientId?: string;
    created?: string;
    updated?: string;
    docImage?: string,
    gstRate?: string,
    stRate?: string,
    taxNumber?: string
    whtRate?: string
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