import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { BehaviorSubject ,Observable ,throwError ,of , ReplaySubject } from 'rxjs';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { Client, ClientPagination, ClientPaymentDetails } from './edit-profile.types';
import { FormControl } from '@angular/forms';

// import { FaqCategory, Guide, GuideCategory } from 'app/modules/merchant/clients-management/create-client/register-client/register-client.types';

@Injectable({
    providedIn: 'root'
})
export class EditProfileService
{
    private _client: BehaviorSubject<Client | null> = new BehaviorSubject(null);
    private _clientPaymentdetails: BehaviorSubject<ClientPaymentDetails | null> = new BehaviorSubject(null);
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

    /**
     * Getter for client payment detail
     *
     */
    get clientPaymentDetails$(): Observable<ClientPaymentDetails>
    {
        return this._clientPaymentdetails.asObservable();
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
     * Get the current logged in client data
     */
     getClientPaymentDetails(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', category: string = ''): 
        Observable<ClientPaymentDetails>
    {

        let id = this._jwt.getJwtPayload(this.accessToken).uid;

        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        
        return this._httpClient.get<ClientPaymentDetails>(userService + '/clients/' + clientId + '/payment_details/', header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from EditProfileService (getClientPaymentDetails)",response);

                this._clientPaymentdetails.next(response["data"].content[0]);
            })
        );
    }    

    /**
     * Update the client profile
     *
     * @param client
     */
     updateClientProfile(clientBody: Client): Observable<Client>
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
 
                     this._logging.debug("Response from StoresService (EditClientProfile)",response);
 
                     // Update the products
                     this._client.next(response["data"]);
 
                     // Return the new product
                     return response["data"];
                 })  
             )) 
            );
    }

        /**
     * Update the client
     *
     * @param client
     */
    updatePaymentProfile(paymentClientId: string , clientPaymentBody: ClientPaymentDetails): Observable<Client>
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
            switchMap(client => this._httpClient.put<ClientPaymentDetails>(userService + '/clients/' + clientId + '/payment_details/' + paymentClientId  , clientPaymentBody , header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (EditClientPayment)",response);

                    // Update the products
                    this._clientPaymentdetails.next(response["data"]);

                    // Return the new product
                    return response["data"];
                })  
            )) 
        );
    }

        /**
     * Create Payment Profile
     * 
     * @param variant
     * @param productId
     */
         createPaymentProfile( clientPaymentBody: ClientPaymentDetails){
            let userService = this._apiServer.settings.apiServer.userService;            
            let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
            let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
        
    
            const header = {
                headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            };
    
            const now = new Date();
            const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();
    
            return this.client$.pipe(
                take(1),
                // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
                switchMap(users => this._httpClient.post<ClientPaymentDetails>(userService + '/clients/' + clientId + '/payment_details/', clientPaymentBody , header).pipe(
                    map((response) => {
    
                        this._logging.debug("Response from  (Create PaymentProfile )",response);
    
                        let newUserPaymentDetails = response["data"];
    
                        // Return the new user payment details
                        return newUserPaymentDetails;
                    })
                ))
            );
        }
}
