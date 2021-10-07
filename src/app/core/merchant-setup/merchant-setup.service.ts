import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MerchantSetup } from 'app/core/merchant-setup/merchant-setup.status';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
// import { resolve } from 'dns';

@Injectable({
    providedIn: 'root'
})
export class MerchantSetupService
{
    private _merchantSetup: ReplaySubject<MerchantSetup> = new ReplaySubject<MerchantSetup>(1);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for Merchant Setup Status
     *
     * @param value
     */
    set merchantSetup(value: MerchantSetup)
    {
        // Store the value
        this._merchantSetup.next(value);
    }

    get merchantSetup$(): Observable<MerchantSetup>
    {
        return this._merchantSetup.asObservable();
    }

    /**
     * Getter for access token
     */
 
     get accessToken(): string
     {
         return localStorage.getItem('accessToken') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current client's Merchant Setup data
     */
    async get(): Promise<Observable<MerchantSetup>>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return await this._httpClient.get<any>(productService + '/stores', header)
        .pipe(
            tap((response) => {

                let storeCount: number;
                let content = response.data.content;

                if (content === undefined || content.length == 0) {
                    storeCount = 0;
                } else {
                    storeCount = content.length;
                }
                
                return this._merchantSetup.next({ storeSetup: storeCount });
            })
        );
    }

    /**
     * Update the Merchant Setup
     *
     * @param user
     */
    update(user: MerchantSetup): Observable<any>
    {
        return this._httpClient.patch<MerchantSetup>('api/common/user', {user}).pipe(
            map((response) => {
                this._merchantSetup.next(response);
            })
        );
    }
}
