import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { take, map, tap, switchMap } from 'rxjs/operators';
import { Client, ClientPaymentDetails, ClientPagination } from 'app/core/user/user.types';
import { AppConfig } from 'app/config/service.config';
import { LogService } from '../logging/log.service';
import { JwtService } from '../jwt/jwt.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserService
{
    private _client: BehaviorSubject<Client | null> = new BehaviorSubject(null);
    private _clientForInv: BehaviorSubject<Client | null> = new BehaviorSubject(null);
    private _clientPaymentdetails: BehaviorSubject<ClientPaymentDetails | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<ClientPagination | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _authService: AuthService,
        private _jwt: JwtService,
        private _logging: LogService
    )
    {
    }

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
     * Getter for clients for inventory
     *
     */
    get clientForInv$(): Observable<Client>
    {
        return this._clientForInv.asObservable();
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

    /**
     * Get the current logged in user data
     */
    get(ownerId: string): Observable<any>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        const header = {
            headers: new HttpHeaders().set("Authorization", this._authService.publicToken)
        };
        
        return this._httpClient.get<any>(userService + '/clients/' + ownerId, header)
            .pipe(
                tap((response) => {
                    this._logging.debug("Response from UserService (Get)",response);
                    return this._client.next(response['data']);
                })
            );
    }

    /**
     * Get the current logged in user data
     */
    getClientForInventory(ownerId: string): Observable<any>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        const header = {
            headers: new HttpHeaders().set("Authorization", this._authService.publicToken)
        };
        
        return this._httpClient.get<any>(userService + '/clients/' + ownerId, header)
            .pipe(
                tap((response) => {
                    this._logging.debug("Response from UserService (getClientForInventory)",response);
                    return this._clientForInv.next(response.data);
                })
            );
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: Client): Observable<any>
    {
        return this._httpClient.patch<Client>('api/common/user', {user}).pipe(
            map((response) => {
                this._client.next(response);
            })
        );
    }

    async getUserChannels() {

        let userService = this._apiServer.settings.apiServer.userService;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const httpOptions = {
            params: {
            userId: clientId
            }
        }
        return await this._httpClient.get(userService + "/userChannels", httpOptions).toPromise();
    }

    /**
    * Get the current logged in client data
    */
    getClient(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', category: string = ''): 
        Observable<Client>
    {

        let id = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
     * Get client by ID by calling API
     * 
     * @param productId 
     * @returns 
     */
    getClientById():Observable<Client>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.get<Client>(userService +'/clients/' + clientId, header).pipe(
            tap((response) => {

                this._logging.debug("Response from UserService (getClientById)", response);

                let updateResponse = response;

                let symplifiedRegion: string;
                let symplifiedCountryId: string;
                if (response['data'].regionCountry.id == 'MYS') {
                    symplifiedCountryId = "MYS";
                    symplifiedRegion = "SEA";
                } else if (response['data'].regionCountry.id == 'PK'){
                    symplifiedCountryId = "PAK";
                    symplifiedRegion = "SA";
                } else {
                    symplifiedCountryId = null;
                    symplifiedRegion = null;
                }

                if (response['data'].regionCountry.id) {
                    updateResponse["symplifiedCountryId"] = symplifiedCountryId;
                    updateResponse["symplifiedRegion"] = symplifiedRegion;
                    updateResponse["countryCode"] = response['data'].regionCountry.id ;
                }

                return this._client.next(response['data']);

            })
        );

    }

    /**
     * Get the current logged in client data
     */
    getClientPaymentDetails(page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', category: string = ''): 
        Observable<ClientPaymentDetails>
    {

        let id = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
         let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
         let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;
 
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
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

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
     * Update the client
     *
     * @param client
     */
    updatePasswordProfile(clientPasswordBody: ClientPaymentDetails): Observable<Client>
    {
        let userService = this._apiServer.settings.apiServer.userService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return this.client$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(client => this._httpClient.put<ClientPaymentDetails>(userService + '/clients/' + clientId + '/changepassword', clientPasswordBody , header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (EditClientPassword)",response);

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
            let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
            let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;
        
    
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

                        // Update the products
                        this._clientPaymentdetails.next(newUserPaymentDetails);
    
                        // Return the new user payment details
                        return newUserPaymentDetails;
                    })
                ))
            );
        }
}
