export interface Locale
{
    id: string;
    name: string;
    symplified_region?: string;
    continent?: string;
    country?: string;
    countryCode?: string;
    region?: string;
}

export declare type AvailableCountries = string[] | {
    id: string;
    label: string;
}[];