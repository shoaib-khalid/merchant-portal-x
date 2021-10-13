import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, Subject } from 'rxjs';
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
    private _stores: BehaviorSubject<Store[] | null> = new BehaviorSubject(null);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for store
     *
     * @param value
     */
    set stores(value: Store[])
    {
        // Store the value
        this._stores.next(value);
    }

    get stores$(): Observable<Store[]>
    {
        return this._stores.asObservable();
    }

    /**
     * Setter & getter for storeId
     */
     set storeId(str: string)
     {
         localStorage.setItem('storeId', str);
     }
 
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
                let _newStores: Array<any> = [];
                return this._stores.next(_newStores);
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
    
}
