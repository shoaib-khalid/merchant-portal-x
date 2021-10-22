import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Store } from 'app/core/store/store.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class StoresService
{
    private _stores: ReplaySubject<Store[]> = new ReplaySubject<Store[]>(1);
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _storeSubDomain: string;

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
     * Setter for store
     *
     * @param value
     */
    set stores(value: Store[])
    {
        // Store the value
        this._stores.next(value);
    }

    /**
     * Getter for store
     *
     */
    get stores$(): Observable<Store[]>
    {
        return this._stores.asObservable();
    }

    /**
     * Setter for storeId
     */
     set storeId(str: string)
     {
         localStorage.setItem('storeId', str);
     }

    /**
     * Getter for storeId
     */

     get storeId$(): string
     {
         return localStorage.getItem('storeId') ?? '';
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
     * Get the current logged in store data
     */
    async get(id: string = null): Promise<Observable<Store>>
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

        if (id !== null) { id = "/" + id } 
        
        return await this._httpClient.get<any>(productService + '/stores' + id, header)
        .pipe(
            tap((response) => {
                // This part still havent been used ... IDK how to use it
                // let _newStores: Array<any> = [];
                this._storeSubDomain = response;
                console.log("HERO HERO",response)
                return this._stores.next(response);
            })
        );
    }

    /**
     * Update the store
     *
     * @param store
     */
    update(store: Store): Observable<any>
    {
        return this._httpClient.patch<Store[]>('api/common/store', {store}).pipe(
            map((response) => {
                this._stores.next(response);
            })
        );
    }

    setFirstStoreId(){
        this.stores$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((storeList: Store[]) => {
                this.storeId = storeList[0].id;
            });  
    }

    async getStoreBaseUrl(storeId: string){
        let storeFrontDomain = this._apiServer.settings.storeFrontDomain;
        console.log("storeId",storeId)
        await console.log(this.get(storeId));
        console.log("storeSubDomain",this._storeSubDomain)
        return 'https://'  + storeFrontDomain;
    }
    
}
