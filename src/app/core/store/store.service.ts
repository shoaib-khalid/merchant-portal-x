import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Store } from 'app/core/store/store.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';

@Injectable({
    providedIn: 'root'
})
export class StoreService
{
    private _store: BehaviorSubject<Store[] | null> = new BehaviorSubject(null);

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
    set store(value: Store[])
    {
        // Store the value
        this._store.next(value);
    }

    get store$(): Observable<Store[]>
    {
        return this._store.asObservable();
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
    async get(): Promise<Observable<Store>>
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
                // THIS STORE SERVICE HAVE NOT BEING USED , WHY ? IDK ... NEED TO DO SOMETHING HERE

                // let storeCount: number;
                // let content = response.data.content;

                // if (content === undefined || content.length == 0) {
                //     storeCount = 0;
                // } else {
                //     storeCount = content.length;
                // }
                
                return this._store.next([{id:"ahsashha",name:"SDFSF",category:""}]);
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
                this._store.next(response);
            })
        );
    }
}
