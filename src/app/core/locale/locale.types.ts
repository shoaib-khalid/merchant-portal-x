export interface Locale
{
    symplifiedCountryId: string;
    symplifiedRegion: string;
    countryCode: string;
}

export declare type AvailableCountries = string[] | {
    countryCode: string;
    label: string;
}[];