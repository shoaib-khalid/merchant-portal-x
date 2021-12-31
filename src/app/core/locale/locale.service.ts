import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AvailableCountries, Locale } from 'app/core/locale/locale.types';
import { AppConfig } from 'app/config/service.config';
import { LogService } from 'app/core/logging/log.service';

@Injectable({
    providedIn: 'root'
})
export class LocaleService
{
    private _locale: ReplaySubject<Locale> = new ReplaySubject<Locale>(1);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for locale
     *
     * @param value
     */
    set locale(value: Locale)
    {
        // Store the value
        this._locale.next(value);
    }

    get locale$(): Observable<Locale>
    {
        return this._locale.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current logged in locale data
     */
    get(): Observable<any>
    {   
        return this._httpClient.get<any>("https://extreme-ip-lookup.com/json?key=47t29ug77EDHEC2zIToW")
        .pipe(
            tap((response) => {
                this._logging.debug("Response from LocaleService",response);

                let updateResponse = response;

                let symplifiedRegion: string;
                let symplifiedCountryId: string;
                if (response.countryCode == 'MY') {
                    symplifiedCountryId = "MYS";
                    symplifiedRegion = "SEA";
                } else if (response.countryCode == 'PK'){
                    symplifiedCountryId = "PAK";
                    symplifiedRegion = "SA";
                } else {
                    symplifiedCountryId = null;
                    symplifiedRegion = null;
                }
        

                if (response.countryCode) {
                    updateResponse["symplifiedCountryId"] = symplifiedCountryId;
                    updateResponse["symplifiedRegion"] = symplifiedRegion;
                    updateResponse["countryCode"] = response.countryCode;
                }

                return this._locale.next(response);
            })
        );
    }

    /**
     * Update the locale
     *
     * @param country
     */
    update(symplifiedCountryId: string, symplifiedRegion: string , countryCode: string): Observable<any>
    {
        let change: Locale = {
            "symplifiedCountryId": symplifiedCountryId,
            "symplifiedRegion": symplifiedRegion,
            "countryCode": countryCode,
        };
        this._locale.next(change);

        return of();
    }

    /**
     * Get all Available countries
     */

    getAvailableCountries(): AvailableCountries{
        return [
            {
                countryCode: "my",
                label: "Malaysia",
            },
            {
                countryCode: "pk",
                label: "Pakistan"
            }
        ];
    }
}
