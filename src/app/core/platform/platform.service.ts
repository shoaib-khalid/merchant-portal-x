import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { switchMap, take, map, tap, catchError, filter } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { takeUntil } from 'rxjs/operators';
import { LogService } from 'app/core/logging/log.service';
import { UntypedFormControl } from '@angular/forms';
import { PlatformLocation } from '@angular/common';
import { Platform } from './platform.types';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class PlatformService
{
    private _platform: BehaviorSubject<Platform | null> = new BehaviorSubject(null);
    private _platforms: BehaviorSubject<Platform[] | null> = new BehaviorSubject(null);
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    public platformControl: UntypedFormControl = new UntypedFormControl();

    private url = {
        full: null,
        domain: null,
        domainName: null,
        subDomainName: null,
    };

    /**
     * Constructor
     */
    constructor(
        private _platformLocation: PlatformLocation,
        private _httpClient: HttpClient,
        private _authService: AuthService,
        private _apiServer: AppConfig,
        private _jwt: JwtService,
        private _logging: LogService
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for store
     *
    */
    get platform$(): Observable<Platform>
    {
        return this._platform.asObservable();
    }

    /**
     * Setter for store
     *
     * @param value
     */
    set platform(value: Platform)
    {
        // Store the value
        this._platform.next(value);
    }

    /**
     * Getter for stores
     *
    */
    get platforms$(): Observable<Platform[]>
    {
        return this._platforms.asObservable();
    }
    
    /**
     * Setter for stores
     *
     * @param value
     */
    set platforms(value: Platform[])
    {
        // Store the value
        this._platforms.next(value);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
    * Set current platform
    */
    set(): Observable<any>
    {        
        // ----------------------
        // Get store by URL
        // ----------------------

        let fullUrl = (this._platformLocation as any).location.origin;
        this.url.full = fullUrl;

        let sanatiseUrl = fullUrl.replace(/^(https?:|)\/\//, '').split(':')[0]; // this will get the domain from the URL
        this.url.domain = sanatiseUrl;

        let domainNameArr = sanatiseUrl.split('.');
        domainNameArr.shift();

        this.url.domainName = domainNameArr.join("."); 
        
        let subDomainName = sanatiseUrl.split('.')[0];
        this.url.subDomainName = subDomainName;
        
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._authService.publicToken;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;        

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params:{
                domain:this.url.domain
            }
        };
        
        return this._httpClient.get<any>(productService + '/platformconfig', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from StoresService (Before Reconstruct)",response);

                    response["data"].map((res)=>{
                            let newPlatform = {
                            id: res.platformId,
                            name: res.platformName,
                            logo: res.platformLogo,
                            logoDark: res.platformLogoDark,
                            country: res.platformCountry,
                            favicon16:res.platformFavIcon,
                            favicon32:res.platformFavIcon32,
                            gacode:res.gaCode,
                        };
                        
                    // set this
                    this.platformControl.setValue(newPlatform);

                    // Update the store
                    this._platform.next(newPlatform);

                    this._logging.debug("Response from PlatformsService (Set)", newPlatform);

                    // Return the store
                    return newPlatform;
                    })

               
                })
            );
    }

    /**
    * Get the current logged in store data
    */
    get(): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;      

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };
        
        return this._httpClient.get<any>(productService + '', header)
            .pipe(
                tap((response) => {
                    
                    this._logging.debug("Response from StoresService (Before Reconstruct)",response);

                    this._platforms.next(response["data"]);
                })
            );
    }

    getPlatformsById(id: string): Observable<any>
    {
        return this._platforms.pipe(
            take(1),
            map((platforms) => {

                // Find the store
                const platform = platforms.find(item => item.id === id) || null;

                // set this
                this.platformControl.setValue(platform);

                this._logging.debug("Response from PlatformsService (getPlatformsById)",platform);

                // Update the store
                this._platforms.next([platform]);

                // Return the store
                return platform;
            }),
            switchMap((platform) => {

                if ( !platform )
                {
                    return throwError('Could not found store with id of ' + id + '!');
                }

                return of(platform);
            })
        );
    }

    getPlatformById(id: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<any>(productService + '' + id , header)
        .pipe(
            map((response) => {
                this._logging.debug("Response from PlatformsService (getPlatformById)",response);
                this._platform.next(response["data"]);

                // set this
                this.platformControl.setValue(response["data"]);

                return response["data"];
            })
        )
    }

    post(storeBody: any): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return this.platforms$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(platforms => this._httpClient.post<any>(productService + '/stores', storeBody , header).pipe(
                map((response) => {

                    this._logging.debug("Response from PlatformsService (Create Platform)",response);

                    let newResponse = response["data"];

                    // Update the products with the new product
                    this._platforms.next([newResponse, ...platforms]);

                    // Return the new product
                    return response;
                })
            ))
        );
    }

    /**
     * Update the store
     *
     * @param store
     */
    update(id: string, body: any): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return this.platforms$.pipe(
            take(1),
            switchMap(stores => this._httpClient.put<any>(productService + '' + id, body , header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (Edit Store)",response);

                    // Find the index of the updated product
                    const index = stores.findIndex(item => item.id === id);

                    // Update the product
                    stores[index] = { ...stores[index], ...response["data"]};

                    // Update the products
                    this._platforms.next(stores);

                    // Return the new product
                    return response["data"];
                }),
                switchMap(response => this.platform$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the product if it's selected
                        this._platform.next(response);

                        // Return the updated product
                        return response;
                    })
                ))
            ))
            
        );
    }

    /**
     * Delete the store
     * 
     * @param storeId
     */

    delete(id: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "clientId": clientId
            }
        };
        
        return this.platforms$.pipe(
            take(1),
            switchMap(platforms => this._httpClient.delete(productService + '' + id, header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (Delete Store)",response);

                    // Find the index of the deleted product
                    const index = platforms.findIndex(item => item.id === id);

                    // Delete the product
                    platforms.splice(index, 1);

                    // Update the products
                    this._platforms.next(platforms);

                    let isDeleted:boolean = false;
                    if (response["status"] === 200) {
                        isDeleted = true
                        
                        // set selected platform to null anyway
                        this.platformControl.setValue(null);
                    }


                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }
}
