export interface Agent
{
    created?: string;
    deactivated?: boolean;
    email: string;
    id?: string;
    liveChatAgentId?: string;
    password: string;
    locked?: boolean;
    name: string;
    roleId: string;
    storeId: string;
    updated?: string;
    username: string;
}

export interface AgentPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}