import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { BehaviorSubject ,Observable ,throwError ,of , ReplaySubject } from 'rxjs';
import {  take, map, tap, switchMap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { Client, ClientPagination } from './edit-profile.types';
import { FormControl } from '@angular/forms';

// import { FaqCategory, Guide, GuideCategory } from 'app/modules/merchant/clients-management/create-client/register-client/register-client.types';

@Injectable({
    providedIn: 'root'
})
export class EditProfileService
{
    private _client: BehaviorSubject<Client | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<ClientPagination | null> = new BehaviorSubject(null);
    public storeControl: FormControl = new FormControl();

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
        private _logging: LogService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for clients
     *
    */
     get client$(): Observable<Client>
     {
         return this._client.asObservable();
     }
 
     /**
      * Setter for clients
      *
      * @param value
      */
     set client(value: Client)
     {
         // Client the value
         this._client.next(value);
     }
 
     /**
      * Setter for storeId
      */
     set clientsId(str: string)
     {
         localStorage.setItem('storeId', str);
     }
 
     /**
      * Getter for storeId
      */
 
     get clientsId$(): string
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

    /**
     * Getter for pagination
     */
     get pagination$(): Observable<ClientPagination>
     {
         return this._pagination.asObservable();
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // ---------------------------
    // Client Section
    // ---------------------------

    /**
     * Get the current logged in client data
     */
     getClient(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', category: string = ''): 
        Observable<Client>
    {

        let id = this._jwt.getJwtPayload(this.accessToken).uid;

        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        // if ada id change url stucture
        if (id !== "") { id = "/" + id } 
        
        return this._httpClient.get<Client>(userService + '/clients' + id, header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from EditProfileService (getClient)",response);

                this._client.next(response["data"]);
            })
        );
    }

    /**
     * Update the client
     *
     * @param client
     */
     updateProfile(clientBody: Client): Observable<Client>
     {
         let userService = this._apiServer.settings.apiServer.userService;
         let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
         let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
 
         const header = {
             headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
             params: {
                 "clientId": clientId
             }
         };
         
         return this.client$.pipe(
             take(1),
             // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
             switchMap(client => this._httpClient.put<Client>(userService + '/clients/' + clientId , clientBody , header).pipe(
                 map((response) => {
 
                     this._logging.debug("Response from StoresService (Edit Client)",response);
 
                     // Update the products
                     this._client.next(response["data"]);
 
                     // Return the new product
                     return response["data"];
                 })  
             )) 
            );
    }
}
