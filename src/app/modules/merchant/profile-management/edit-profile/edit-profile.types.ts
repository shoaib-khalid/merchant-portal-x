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
    roleId: string
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