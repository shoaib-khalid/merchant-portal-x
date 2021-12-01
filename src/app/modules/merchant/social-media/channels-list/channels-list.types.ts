export interface ChannelsList
{
    id: string;
    refId: string;
    userId: string;
    channelName: string;
    token: string;
}

export interface ChannelsListPagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}