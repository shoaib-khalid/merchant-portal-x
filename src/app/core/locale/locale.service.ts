import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AvailableCountries, Locale } from 'app/core/locale/locale.types';
import { AppConfig } from 'app/config/service.config';

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
        private _apiServer: AppConfig
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
    async get(): Promise<Observable<Locale>>
    {   
        return await this._httpClient.get<any>("https://extreme-ip-lookup.com/json")
        .pipe(
            tap((response) => {
                return this._locale.next(response);
            })
        );
    }

    /**
     * Update the locale
     *
     * @param country
     */
    update(countryCode: string, symplified_region: string): Observable<any>
    {
        let change: Locale = {
            id: '',
            name: '',
            "symplified_region": symplified_region,
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
                id: "my",
                label: "Malaysia",
            },
            {
                id: "pk",
                label: "Pakistan"
            }
        ];
    }
}
