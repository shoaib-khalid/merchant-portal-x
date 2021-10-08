import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Locale } from 'app/core/locale/locale.types';
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
        let token = "accessToken";

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${token}`)
        };
        
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
     * @param locale
     */
    update(locale: Locale): Observable<any>
    {
        return this._httpClient.patch<Locale>('api/common/locale', {locale}).pipe(
            map((response) => {
                this._locale.next(response);
            })
        );
    }
}
