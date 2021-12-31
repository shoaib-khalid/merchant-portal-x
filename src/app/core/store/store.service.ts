import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, ReplaySubject, Subject, throwError } from 'rxjs';
import { switchMap, take, map, tap, catchError, filter } from 'rxjs/operators';
import { Store, StoreRegionCountries, StoreTiming, StorePagination, StoreAssets, CreateStore, StoreDeliveryDetails, StoreSelfDeliveryStateCharges, StoreDeliveryProvider } from 'app/core/store/store.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { takeUntil } from 'rxjs/operators';
import { LogService } from 'app/core/logging/log.service';
import { FormControl } from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class StoresService
{
    private _store: BehaviorSubject<Store | null> = new BehaviorSubject(null);
    private _stores: BehaviorSubject<Store[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<StorePagination | null> = new BehaviorSubject(null);
    private _storeRegionCountries: ReplaySubject<StoreRegionCountries[]> = new ReplaySubject<StoreRegionCountries[]>(1);
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private _currentStores: Store[] = [];
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

    /**
     * Getter for store
     *
    */
    get store$(): Observable<Store>
    {
        return this._store.asObservable();
    }

    /**
     * Setter for stores
     *
     * @param value
     */
    set store(value: Store)
    {
        // Store the value
        this._store.next(value);
    }

    /**
     * Getter for stores
     *
    */
    get stores$(): Observable<Store[]>
    {
        return this._stores.asObservable();
    }
    
    /**
     * Setter for stores
     *
     * @param value
     */
    set stores(value: Store[])
    {
        // Store the value
        this._stores.next(value);
    }


    /**
     * Getter for store region countries
     *
     */
    get storeRegionCountries$(): Observable<StoreRegionCountries[]>
    {
        return this._storeRegionCountries.asObservable();
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

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<StorePagination>
    {
        return this._pagination.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    // ---------------------------
    // Store Section
    // ---------------------------

    /**
     * Get the current logged in store data
     */
     getStores(id: string = "", page: number = 0, size: number = 10, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', category: string = ''): 
        Observable<{ pagination: StorePagination; stores: Store[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                clientId: clientId,
                page: '' + page,
                pageSize: '' + size,
                sortByCol: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name: '' + search
            }
        };

        if (category !== "") {
            header.params["verticalCode"] = category;
        }

        // if ada id change url stucture
        if (id !== "") { id = "/" + id } 
        
        return this._httpClient.get<{ pagination: StorePagination; stores: Store[] }>(productService + '/stores' + id, header)
        .pipe(
            tap((response) => {
                
                this._logging.debug("Response from StoresService (Before Reconstruct)",response);

                // Pagination
                let _pagination = {
                    length: response["data"].totalElements,
                    size: response["data"].size,
                    page: response["data"].number,
                    lastPage: response["data"].totalPages,
                    startIndex: response["data"].pageable.offset,
                    endIndex: response["data"].pageable.offset + response["data"].numberOfElements - 1
                }
                this._logging.debug("Response from StoresService (pagination)",_pagination);
                
                // this is local
                this._currentStores = response["data"].content;
                
                (this._currentStores).forEach(async (item, index) => {
                    // let assets = await this.getStoreAssets(item.id);
                    // this._currentStores[index] = Object.assign(this._currentStores[index],{storeLogo: "" });
                    this._currentStores[index] = Object.assign(this._currentStores[index],{slug: item.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '')});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{duration: 30});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{totalSteps: 3});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{featured: true});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{progress: { completed: 2, currentStep: 2  }});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{category: item.type});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{completed: 2});
                    this._currentStores[index] = Object.assign(this._currentStores[index],{currentStep: 3});
                    // this._currentStores[index]["storeLogo"] = (assets && assets !== null) ? assets["logoUrl"] : "";
                });

                this._logging.debug("Response from StoresService (After Reconstruct)",this._currentStores);

                // this is observable service

                this._pagination.next(_pagination);
                this._stores.next(this._currentStores);
            })
        );
    }

    getStoresById(id: string): Observable<Store>
    {
        return this._stores.pipe(
            take(1),
            map((stores) => {

                // Find the store
                const store = stores.find(item => item.id === id) || null;

                // set this
                this.storeControl.setValue(store);

                this._logging.debug("Response from StoresService (getStoresById)",store);

                // Update the store
                this._store.next(store);

                // Return the store
                return store;
            }),
            switchMap((store) => {

                if ( !store )
                {
                    return throwError('Could not found store with id of ' + id + '!');
                }

                return of(store);
            })
        );
    }

    getStoreById(id: string): Observable<Store>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        
        return this._httpClient.get<Store>(productService + '/stores/' + id , header)
        .pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (getStoreById)",response);
                this._store.next(response["data"]);

                return response["data"];
            })
        )
    }

    post(storeBody: CreateStore): Observable<any>
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
        
        return this.stores$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(stores => this._httpClient.post<Store>(productService + '/stores', storeBody , header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (Create Store)",response);

                    let newResponse = response["data"];
                    newResponse.slug = newResponse.name.toLowerCase().replace(/ /g, '-').replace(/[-]+/g, '-').replace(/[^\w-]+/g, '');
                    newResponse.duration = 30;
                    newResponse.totalSteps = 3;
                    newResponse.featured = true;
                    newResponse.progress = { completed: 2, currentStep: 2  };
                    newResponse.category = newResponse.type;
                    newResponse.completed = 2;
                    newResponse.currentStep = 3;

                    // Update the products with the new product
                    this._stores.next([newResponse, ...stores]);

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
    update(storeId: string, storeBody: Store): Observable<Store>
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
        
        return this.stores$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            switchMap(stores => this._httpClient.put<Store>(productService + '/stores/' + storeId , storeBody , header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (Edit Store)",response);

                    // Find the index of the updated product
                    const index = stores.findIndex(item => item.id === storeId);

                    // Update the product
                    stores[index] = { ...stores[index], ...response["data"]};

                    // Update the products
                    this._stores.next(stores);

                    // Return the new product
                    return response["data"];
                }),
                switchMap(response => this.store$.pipe(
                    take(1),
                    filter(item => item && item.id === storeId),
                    tap(() => {

                        // Update the product if it's selected
                        this._store.next(response);

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

    delete(storeId: string): Observable<any>
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
        
        return this.stores$.pipe(
            take(1),
            switchMap(stores => this._httpClient.delete(productService +'/stores/' + storeId, header).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (Delete Store)",response);

                    // Find the index of the deleted product
                    const index = stores.findIndex(item => item.id === storeId);

                    // Delete the product
                    stores.splice(index, 1);

                    // Update the products
                    this._stores.next(stores);

                    let isDeleted:boolean = false;
                    if (response["status"] === 200) {
                        isDeleted = true
                    }

                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }

    setFirstStoreId(){
        this.stores$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((storeList: Store[]) => {
                this.storeId = storeList[0].id;
            });  
    }

    // ---------------------------
    // Store Region Countries Section
    // ---------------------------

    getStoreRegionCountries(): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.get<any>(productService + '/region-countries', header)
            .pipe(
                tap((response) => {
                    this._logging.debug("Response from StoresService (getStoreRegionCountries)",response);
                    return this._storeRegionCountries.next(response["data"].content);
                })
            );
    }

    getStoreRegionCountryState(regionCountryId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                "regionCountryId": regionCountryId
            }
        };

        return this._httpClient.get<any>(productService + '/region-country-state', header)
            .pipe(
                tap((response) => {
                    this._logging.debug("Response from StoresService (getStoreRegionCountryState)",response);
                    return response;
                })
            );
    }

    // ---------------------------
    // Store Timing Section
    // ---------------------------

    postTiming(storeId: string, storeTiming: StoreTiming): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<any>(productService + '/stores/' + storeId + '/timings', storeTiming , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (postTiming)",response);
            })
        );
    }

    setTimingToStore(storeId: string, storeTiming: StoreTiming): Observable<any>
    {
        return this.stores$.pipe(
            take(1),
            // switchMap(products => this._httpClient.post<InventoryProduct>('api/apps/ecommerce/inventory/product', {}).pipe(
            map((stores) => {
                this._logging.debug("Setting Timing To Store manually (setTimingToStore)",stores);

                // Find the index of the updated product
                const index = stores.findIndex(item => item.id === storeId);

                let updatedStore = stores[index];
                updatedStore.storeTiming = storeTiming

                // Update the product
                stores[index] = { ...stores[index], ...updatedStore};

                // Update the products
                this._stores.next(stores);

                // Return the new product
                return stores["data"];
            })
        );
    }

    putTiming(storeId: string, day: string ,storeTiming: StoreTiming): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.put<any>(productService + '/stores/' + storeId + '/timings/' + day, storeTiming , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (putTiming)",response);
            })
        );
    }

    getStoreSnooze(): Observable<any>
    {
        
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };
        return this._httpClient.get<any>(productService + '/stores/' + this.storeId$ + '/timings/snooze', header)
            .pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService (getStoreSnooze)",response);
                    return response.data;
                })
            );
    }

    putStoreSnooze(result): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        let params = "?isSnooze=" + result.isSnooze + "&snoozeReason=" + result.snoozeReason + "&snoozeDuration=" + result.snoozeDuration;
        
        return this._httpClient.put<any>(productService + '/stores/' + this.storeId$ + '/timings/snooze' + params, header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (putStoreSnooze)",response);
            })
        );
    }

    // ---------------------------
    // Store Assets Section
    // ---------------------------

    async getStoreAssets(storeId: string)
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        let response = await this._httpClient.get<any>(productService + '/stores/' + storeId + '/assets', header).toPromise();

        let index = this._currentStores.findIndex(item => item.id === storeId);

        let storeName: string = (index < 0) ? "undefined" : this._currentStores[index].name;

        this._logging.debug("Response from StoresService (getStoreAssets) (store: " + storeName + ")",response);
        return response.data;
    }

    postAssets(storeId: string, storeAssets, storeAssetType = null , storeAssetFiles = null): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.stores$.pipe(
            take(1),
            switchMap(stores => this._httpClient.post<any>(productService + '/stores/' + storeId + '/assets', storeAssets , header ).pipe(
                map((response) => {

                    this._logging.debug("Response from StoresService stores (postAssets)",response);

                    // --------------
                    // Update Stores
                    // --------------

                    // Find the index of the updated product
                    const index = stores.findIndex(item => item.id === storeId);

                    let updateResponse;
                    
                    if (storeAssetType === "logo") {
                        updateResponse = Object.assign(stores[index],{storeAsset:{ logoUrl: storeAssetFiles}});
                    } else if (storeAssetType === "banner") {
                        updateResponse = Object.assign(stores[index],{storeAsset:{ bannerUrl: storeAssetFiles}});
                    }
                    // Update the product
                    stores[index] = { ...stores[index], ...updateResponse};

                    // Update the products
                    this._stores.next(stores);

                    // ---------------
                    // Update Store
                    // ---------------
                    this._store.next(stores[index]);

                    // set this
                    if (storeAssetType === "logo") {
                        this.storeControl.setValue(stores[index]);
                    }

                    // return value
                    return response["data"];
                })
            ))
        );
    }

    deleteAssetsBanner(storeId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.delete<any>(productService + '/stores/' + storeId + '/assets/banner' , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (deleteAssetsBanner)",response);
            })
        );
    }

    deleteAssetsLogo(storeId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.delete<any>(productService + '/stores/' + storeId + '/assets/logo' , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (deleteAssetsLogo)",response);
            })
        );
    }

    // ---------------------------
    // Store Delivery Provider Section
    // ---------------------------

    getStoreDeliveryProvider(query: StoreDeliveryProvider): Observable<StoreDeliveryProvider[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                deliveryType: query ? query.deliveryType : null,
                regionCountryId: query.regionCountryId
            }
        };

        // if query exist
        if (!query.deliveryType)
            delete header.params.deliveryType;

        return this._httpClient.get<any>(productService + '/deliveryProvider', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (getStoreDeliveryProvider)",response);
                    return response.data;
                })
            );
    }

    // ------------------------------------------------------
    // Store Region Country Delivery Service Provider Section
    // ------------------------------------------------------

    getStoreRegionCountryDeliveryProvider(storeId: string, deliveryServiceProviderId: string = ""): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                deliverySpId: deliveryServiceProviderId,
                storeId: storeId
            }
        };

        if (deliveryServiceProviderId === "") {
            delete header.params.deliverySpId;
        }

        return this._httpClient.get<any>(productService + '/stores/' + storeId + '/deliveryServiceProvider', header).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (getStoreRegionCountryDeliveryProvider)",response);

                return response.data.content;
            })
        );
    }

    postStoreRegionCountryDeliveryProvider(storeId: string, deliveryServiceProviderId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<any>(productService + '/stores/' + storeId + '/deliveryServiceProvider/' + deliveryServiceProviderId , header).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (postStoreRegionCountryDeliveryProvider)",response);
            })
        );
    }

    putStoreRegionCountryDeliveryProvider(storeId: string, id: string, deliveryServiceProviderId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        let queryParam = deliveryServiceProviderId ? "?deliverySpId=" + deliveryServiceProviderId : "";

        return this._httpClient.put<any>(productService + '/stores/' + storeId + '/deliveryServiceProvider/' + id + queryParam , header).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (postStoreRegionCountryDeliveryProvider)",response);
            })
        );
    }

    deleteStoreRegionCountryDeliveryProviderAll(storeId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.delete<any>(productService + '/stores/' + storeId + '/deliveryServiceProvider/all', header).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (postStoreRegionCountryDeliveryProvider)",response);
            })
        );
    }

    // ---------------------------
    // Store Delivery Details Section
    // ---------------------------

    getStoreDeliveryDetails(storeId: string): Observable<StoreDeliveryDetails>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`)
        };

        return this._httpClient.get<any>(productService + '/stores/' + storeId + '/deliverydetails', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (getStoreDeliveryDetails)",response);
                    return response.data;
                })
            );
    }

    postStoreDeliveryDetails(storeId: string, storeDelivery: StoreDeliveryDetails): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<any>(productService + '/stores/' + storeId + '/deliverydetails', storeDelivery , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (postStoreDeliveryDetails)",response);
            })
        );
    }

    putStoreDeliveryDetails(storeId: string, storeDelivery: StoreDeliveryDetails): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.put<any>(productService + '/stores/' + storeId + '/deliverydetails', storeDelivery , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (putStoreDeliveryDetails)",response);
            })
        );
    }
    
    // ---------------------------
    // Store Delivery Charges by States Section
    // ---------------------------

    getSelfDeliveryStateCharges(storeId: string): Observable<StoreSelfDeliveryStateCharges[]>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {  
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.get<any>(productService + '/stores/' + storeId + '/stateDeliveryCharge', header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from StoresService (getSelfDeliveryStateCharges)",response);
                    return response.data;
                })
            );
    }

    postSelfDeliveryStateCharges(storeId: string, stateDeliveryCharge: StoreSelfDeliveryStateCharges): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.post<any>(productService + '/stores/' + storeId + '/stateDeliveryCharge', stateDeliveryCharge , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (postSelfDeliveryStateCharges)",response);
                return response.data;
            })
        );
    }

    putSelfDeliveryStateCharges(storeId: string, stateDeliveryId: string, stateDeliveryCharge: StoreSelfDeliveryStateCharges): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.put<any>(productService + '/stores/' + storeId + '/stateDeliveryCharge/' + stateDeliveryId, stateDeliveryCharge , header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (putSelfDeliveryStateCharges)",response);
                return response.data;
            })
        );
    }

    deleteSelfDeliveryStateCharges(storeId: string, stateDeliveryId: string): Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.delete<any>(productService + '/stores/' + storeId + '/stateDeliveryCharge/' + stateDeliveryId, header ).pipe(
            map((response) => {
                this._logging.debug("Response from StoresService (deleteSelfDeliveryStateCharges)",response);
                return response.data;
            })
        );
    }

    // ---------------------------
    // Others Section
    // ---------------------------

    async getExistingName(name:string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params:{
                storeName: name
            }
        };

        let response = await this._httpClient.get<any>(productService + '/stores/checkname', header)
                            .pipe<any>(catchError((error:HttpErrorResponse)=>{
                                    return of(error);
                                })
                            )
                            .toPromise();
    

        this._logging.debug("Response from StoresService (getExistingName) ",response);
        
        //if exist status = 409, if not exist status = 200
        return response.status;

    }

    async getExistingURL(url: string){
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                domain: url
            }
        };

        let response = await this._httpClient.get<any>(productService + '/stores/checkdomain', header)
                                .pipe(catchError((err: HttpErrorResponse) => {
                                    return of(err);
                                }))
                                .toPromise();

        this._logging.debug("Response from StoresService (getExistingURL)",response);

        // if exists status = 409, if not exists status = 200
        return response.status;
    }
}
