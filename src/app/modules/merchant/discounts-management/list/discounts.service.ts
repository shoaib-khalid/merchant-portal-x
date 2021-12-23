import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Discount, DiscountPagination, StoreDiscountTierList } from 'app/modules/merchant/discounts-management/list/discounts.types';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Injectable({
    providedIn: 'root'
})
export class DiscountsService
{
    // Private
    private _discount: BehaviorSubject<Discount | null> = new BehaviorSubject(null);
    private _discounts: BehaviorSubject<Discount[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<DiscountPagination | null> = new BehaviorSubject(null);

    private _discountTier: BehaviorSubject<StoreDiscountTierList | null> = new BehaviorSubject(null);
    private _discountTierList: BehaviorSubject<StoreDiscountTierList[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService,
        private _jwt: JwtService,
        private _fuseConfirmationService: FuseConfirmationService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for discount
     */
    get discount$(): Observable<Discount>
    {
        return this._discount.asObservable();
    }

    /**
     * Getter for discounts
     */
    get discounts$(): Observable<Discount[]>
    {
        return this._discounts.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<DiscountPagination>
    {
        return this._pagination.asObservable();
    }

    /**
     * Getter for discount
     */
     get discountTierList$(): Observable<StoreDiscountTierList[]>
     {
         return this._discountTierList.asObservable();
     }
 
     /**
      * Getter for discounts
      */
     get discountTier$(): Observable<StoreDiscountTierList>
     {
         return this._discountTier.asObservable();
     }

    /**
     * Getter for access token
     */
 
     get accessToken(): string
     {
         return localStorage.getItem('accessToken') ?? '';
     }

    /**
     * Getter for storeId
     */
 
     get storeId$(): string
     {
         return localStorage.getItem('storeId') ?? '';
     }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get discounts
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getDiscounts(page: number = 0, size: number = 20, sort: string = 'startDate', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = ''):
        Observable<{ pagination: DiscountPagination; discounts: Discount[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page: '' + page,
                pageSize: '' + size,
                sortByCol: '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                discountName: '' + search,
                isActive: '' + status
            }
        };

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/discount/search', header).pipe(
            tap((response) => {

                this._logging.debug("Response from DiscountsService",response);

                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                // let _pagination = { length: 0, size: 0, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 };
                this._pagination.next(_pagination);
                // this._discounts.next(response.data);
                this._discounts.next(response.data.content);

            })
        );
    }

    /**
     * Get discount by id
     */
    getDiscountById(id: string): Observable<Discount>
    {
        return this._discounts.pipe(
            take(1),
            map((discounts) => {

                // Find the discount
                const discount = discounts.find(item => item.id === id) || null;

                this._logging.debug("Response from DiscountsService (Current Discount)",discount);

                // Update the discount
                this._discount.next(discount);

                // Return the discount
                return discount;
            }),
            switchMap((discount) => {

                if ( !discount )
                {
                    return throwError('Could not found discount with id of ' + id + '!');
                }

                return of(discount);
            })
        );
    }

    /**
     * Create discount
     */
    createDiscount(body: Discount): Observable<Discount>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        return this.discounts$.pipe(
            take(1),
            // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
            switchMap(discounts => this._httpClient.post<Discount>(productService + '/stores/' + this.storeId$ + '/discount', body , header).pipe(
                map((newDiscount) => {

                    this._logging.debug("Response from DiscountsService (createDiscount)",newDiscount);

                    // Update the discounts with the new discount
                    this._discounts.next([newDiscount["data"], ...discounts]);

                    // Return the new discount
                    return newDiscount;
                })
            ))
        );
    }

    /**
     * Update discount
     *
     * @param id
     * @param discount
     */
    updateDiscount(id: string, body: Discount): Observable<Discount>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.discounts$.pipe(
            take(1),
            // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
            switchMap(discounts => this._httpClient.put<Discount>(productService + '/stores/' + this.storeId$ + '/discount/' , body , header).pipe(
                map((updatedDiscount) => {

                    // Find the index of the updated discount
                    const index = discounts.findIndex(item => item.id === id);

                    // Update the discount
                    discounts[index] = { ...discounts[index], ...updatedDiscount["data"]};

                    // Update the discounts
                    this._discounts.next(discounts);

                    // Return the updated discount
                    return updatedDiscount["data"];
                }),
                switchMap(updatedDiscount => this.discount$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the discount if it's selected
                        this._discount.next(updatedDiscount["data"]);

                        // Return the updated discount
                        return updatedDiscount["data"];
                    })
                ))
            ))
        );
    }

    /**
     * Delete the discount
     *
     * @param discountId
     */
    deleteDiscount(discountId: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.discounts$.pipe(
            take(1),
            switchMap(discounts => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/discount/'+discountId, header).pipe(
                map((status: number) => {

                    // Find the index of the deleted discount
                    const index = discounts.findIndex(item => item.id === discountId);

                    // Delete the discount
                    discounts.splice(index, 1);

                    // Update the discounts
                    this._discounts.next(discounts);

                    let isDeleted:boolean = false;
                    if (status === 200) {
                        isDeleted = true
                    }

                    // Return the deleted status
                    return isDeleted;
                })
            ))
        );
    }

    /**
     * 
     * DISCOUNT TIER
     * 
     */

    /**
     * Get discounts tier
     *
     * @param page
     * @param size
     * @param sort
     * @param order
     * @param search
     */
    getDiscountsTier(discountId: string, page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE'):
         Observable<{ pagination: DiscountPagination; discountTierList: StoreDiscountTierList[] }>
     {
         let productService = this._apiServer.settings.apiServer.productService;
         let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
 
         const header = {
             headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            //  params: {
            //      page: '' + page,
            //      pageSize: '' + size,
            //      sortByCol: '' + sort,
            //      sortingOrder: '' + order.toUpperCase(),
            //      name: '' + search,
            //      status: '' + status
            //  }
         };
 
         return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/discount/'+discountId+'/tier', header).pipe(
             tap((response) => {
 
                 this._logging.debug("Response from DiscountsService (getDiscountsTier)",response);
 
                 // let _pagination = {
                 //     length: response.data.totalElements,
                 //     size: response.data.size,
                 //     page: response.data.number,
                 //     lastPage: response.data.totalPages,
                 //     startIndex: response.data.pageable.offset,
                 //     endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                 // }
                //  let _pagination = { length: 0, size: 0, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 };
                //  this._pagination.next(_pagination);
                 this._discountTierList.next(response.data);
             })
         );
     }

    createDiscountTier(discountId: string, discountTier: StoreDiscountTierList): Observable<StoreDiscountTierList>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        const now = new Date();
        const date = now.getFullYear() + "-" + (now.getMonth()+1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes()  + ":" + now.getSeconds();

        return this.discountTierList$.pipe(
            take(1),
            // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
            switchMap(discountTierList => this._httpClient.post<any>(productService + '/stores/' + this.storeId$ + '/discount/' + discountId + '/tier' , discountTier , header).pipe(
                map((newDiscountTier) => {

                    // Return the new discount
                    return newDiscountTier;
                })
            ))
        );
    }

    /**
     * Delete the discount tier
     *
     * @param id
     */
         deleteDiscountTier(discountId: string, discountTierId: string): Observable<boolean>
         {
             let productService = this._apiServer.settings.apiServer.productService;
             let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
             let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
     
             const header = {
                 headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
             };
           
             return this.discountTierList$.pipe(
                 take(1),
                 switchMap(discountTier => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/discount/'+ discountId +'/tier/'+discountTierId, header).pipe(
                     map((response) => {
     
                         // Find the index of the deleted discount
                         const index = discountTier.findIndex(item => item.id === discountTierId);
     
                         // Delete the discount
                         discountTier.splice(index, 1);
     
                         // Update the discounts
                         this._discountTierList.next(discountTier);
     
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
     
         updateDiscountTier(StorediscountId: string, body: StoreDiscountTierList): Observable<any>
         {
             let productService = this._apiServer.settings.apiServer.productService;
             let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
             let clientId = this._jwt.getJwtPayload(this.accessToken).uid;
     
             const header = {
                 headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
             };
               return this._httpClient.put(productService + '/stores/' + this.storeId$ + '/discount/' + StorediscountId + '/tier', body, header);
         }

}
