import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ApiResponseModel, StoreDiscountProduct, StoreDiscountProductPagination } from './discountsproduct.types';
import { TranslocoTestingModule } from '@ngneat/transloco';

@Injectable({
    providedIn: 'root'
})
export class DiscountsProductService
{
    // Private
    private _discountProduct: BehaviorSubject<StoreDiscountProduct | null> = new BehaviorSubject(null);
    private _discountsProduct: BehaviorSubject<StoreDiscountProduct[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<StoreDiscountProductPagination | null> = new BehaviorSubject(null);

  

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
    get discount$(): Observable<StoreDiscountProduct>
    {
        return this._discountProduct.asObservable();
    }

    /**
     * Getter for discounts
     */
    get discounts$(): Observable<StoreDiscountProduct[]>
    {
        return this._discountsProduct.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<StoreDiscountProductPagination>
    {
        return this._pagination.asObservable();
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
    getDiscountsProduct(discountId):
    Observable<StoreDiscountProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/discount/'+discountId+'/product', header).pipe(
            tap((response) => {

                this._logging.debug("Response from DiscountsService",response);
           
                // let _pagination = { length: 0, size: 0, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 };
                // this._pagination.next(_pagination);
                // this._discountsProduct.next(response.data);
                // this._discountsProduct.next(response.data.content);

            })
        );
    }


    /**
     * Get discount by id
     */
    getDiscountById(id: string): Observable<StoreDiscountProduct>
    {
        return this._discountsProduct.pipe(
            take(1),
            map((discounts) => {

                // Find the discount
                const discount = discounts.find(item => item.id === id) || null;

                this._logging.debug("Response from DiscountsService (Current StoreDiscountProduct)",discount);

                // Update the discount
                this._discountProduct.next(discount);

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

    //get store discount products
    getStoreDiscountProduct(discountId: string) : Observable<ApiResponseModel<StoreDiscountProduct>>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
        return this._httpClient.get<ApiResponseModel<StoreDiscountProduct>>(productService +'/stores/'+this.storeId$+'/discount/'+discountId+'/product',header);
    }


    createProductDiscount(discountId: string, discountProduct:StoreDiscountProduct ): Observable<StoreDiscountProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };

        return this.discount$.pipe(
            take(1),
            switchMap(_discountProduct => this._httpClient.post<any>(productService + '/stores/' + this.storeId$ + '/discount/' + discountId + '/product' , discountProduct , header).pipe(
                map((newdiscountProduct) => {

                    // Return the new discount
                    return newdiscountProduct;
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
    updateDiscount(id: string, body: StoreDiscountProduct): Observable<StoreDiscountProduct>
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
            switchMap(discounts => this._httpClient.put<StoreDiscountProduct>(productService + '/stores/' + this.storeId$ + '/discount/' , body , header).pipe(
                map((updatedDiscount) => {

                    // Find the index of the updated discount
                    const index = discounts.findIndex(item => item.id === id);

                    // Update the discount
                    discounts[index] = { ...discounts[index], ...updatedDiscount["data"]};

                    // Update the discounts
                    this._discountsProduct.next(discounts);

                    // Return the updated discount
                    return updatedDiscount["data"];
                }),
                switchMap(updatedDiscount => this.discount$.pipe(
                    take(1),
                    filter(item => item && item.id === id),
                    tap(() => {

                        // Update the discount if it's selected
                        this._discountProduct.next(updatedDiscount["data"]);

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
    deleteDiscountProduct(discountId,discountProductId: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this.accessToken).act;
        let clientId = this._jwt.getJwtPayload(this.accessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        };
      
        return this.discounts$.pipe(
            take(1),
            switchMap(discounts => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/discount/'+discountId + '/product/'+discountProductId, header).pipe(
                map((status: number) => {

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


}
