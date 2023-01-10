export interface Tag
{
    id          : string;
    keyword     : string;
    tagConfig   : TagConfig[];
}

export interface TagConfig
{
    id      : number;
    property: string;
    content : string;
    tagId   : string;
}

export interface TagDetails
{
    tagId           : number;
    storeId         : string;
    isFoodCourtOwner: boolean;
    tagKeyword: {
                    id       : number;
                    keyword  : string;
                    longitude: string;
                    latitude : string;
                }
}

export interface ZoneTable
{
    id?      : number;
    tagId?   : number;
    tagTables?: TagTable[];
    zoneName : string
}

export interface TagTable
{
    id?                     : number;
    combinationTableNumber  : string;
    tableNumber             : string;
    tablePrefix             : string;
    zoneId?                 : number;
    edited?                 : boolean;
}