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
import { Product } from 'app/core/product/inventory.types';

@Injectable({
    providedIn: 'root'
})
export class DiscountsProductService
{
    // Private
    //for discount product service
    private _discountProduct: BehaviorSubject<StoreDiscountProduct | null> = new BehaviorSubject(null);
    private _discountsProduct: BehaviorSubject<StoreDiscountProduct[] | null> = new BehaviorSubject(null);
    private _pagination: BehaviorSubject<StoreDiscountProductPagination | null> = new BehaviorSubject(null);

    //for product 
    private _product: BehaviorSubject<Product | null> = new BehaviorSubject(null);
    private _products: BehaviorSubject<Product[]| null> = new BehaviorSubject(null);

    // private static readonly SERVICE_URL = `${_apiServer.settings.apiServer.productService}/core2/tnt/dm/cms-posts`;
  
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService,
        private _jwt: JwtService,
        private _fuseConfirmationService: FuseConfirmationService,
    )

    {
    }

    get discount$(): Observable<StoreDiscountProduct>
    {
        return this._discountProduct.asObservable();
    }

    get discounts$(): Observable<StoreDiscountProduct[]>
    {
        return this._discountsProduct.asObservable();
    }

    get pagination$(): Observable<StoreDiscountProductPagination>
    {
        return this._pagination.asObservable();
    }

    get product$(): Observable<Product>
    {
        return this._product.asObservable();
    }

    get products$(): Observable<Product[]>
    {
        return this._products.asObservable();
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    get storeId$(): string
    {
         return localStorage.getItem('storeId') ?? '';
    }

    get httpOptions$() {
        return {
          headers: new HttpHeaders().set("Authorization", `Bearer ${this.jwtToken$}`),
        };
    }
    
    get jwtToken$(){
        return this._jwt.getJwtPayload(this.accessToken).act;
    }

    get productService$()
    {
        return this._apiServer.settings.apiServer.productService;
    }

    // -----------------------------------------------------------------------------------------------------
    // Product Discount
    // -----------------------------------------------------------------------------------------------------

    getDiscountsProduct(discountId):Observable<StoreDiscountProduct>
    {
        return this._httpClient.get<any>(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId+'/product', this.httpOptions$).pipe(
            tap((response) => {

                this._logging.debug("Response from DiscountsService",response);
           
                // let _pagination = { length: 0, size: 0, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 };
                // this._pagination.next(_pagination);
                // this._discountsProduct.next(response.data);
                // this._discountsProduct.next(response.data.content);

            })
        );
    }

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

    getStoreDiscountProduct(discountId: string) : Observable<ApiResponseModel<StoreDiscountProduct>>
    {

        return this._httpClient.get<ApiResponseModel<StoreDiscountProduct>>(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId+'/product',this.httpOptions$);
    }


    createProductDiscount(discountId: string, discountProduct:StoreDiscountProduct ): Observable<StoreDiscountProduct>
    {
        return this.discount$.pipe(
            take(1),
            switchMap(_discountProduct => this._httpClient.post<any>(this.productService$ + '/stores/' + this.storeId$ + '/discount/' + discountId + '/product' , discountProduct , this.httpOptions$).pipe(
                map((newdiscountProduct) => {

                    // Return the new discount
                    return newdiscountProduct;
                })
            ))
        );
    }

    updateProductDiscount(discountId: string, body: StoreDiscountProduct): Observable<StoreDiscountProduct>
    {
        return this.discounts$.pipe(
            take(1),
            // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
            switchMap(discounts => this._httpClient.put<StoreDiscountProduct>(this.productService$ + '/stores/' + this.storeId$ + '/discount/'+ discountId + '/product', body , this.httpOptions$).pipe(
                map((updatedDiscount) => {

                    // // Find the index of the updated discount
                    // const index = discounts.findIndex(item => item.id === discountId);

                    // // Update the discount
                    // discounts[index] = { ...discounts[index], ...updatedDiscount["data"]};

                    // // Update the discounts
                    // this._discountsProduct.next(discounts);

                    // Return the updated discount
                    return updatedDiscount["data"];
                })
            ))
        );
    }

    deleteDiscountProduct(discountId,discountProductId: string): Observable<boolean>
    {
       
        return this.discounts$.pipe(
            take(1),
            switchMap(discounts => this._httpClient.delete(this.productService$ +'/stores/'+this.storeId$+'/discount/'+discountId + '/product/'+discountProductId, this.httpOptions$).pipe(
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

    
    // -----------------------------------------------------------------------------------------------------
    // Product Service
    // -----------------------------------------------------------------------------------------------------
    // this service we use for dropdown listing
    getProducts():Observable<ApiResponseModel<Product[]>>
    {
        return this._httpClient.get<ApiResponseModel<Product[]>>(this.productService$ +'/stores/'+this.storeId$+'/products', this.httpOptions$).pipe(
            tap((response : ApiResponseModel<Product[]>) => {

                this._logging.debug("Response from Product Service in Product Discount Service",response);

                // this._products.next(response.data);
            })
        );
    }

    getProductById(productId:string):Observable<ApiResponseModel<Product>>
    {
        return this._httpClient.get<ApiResponseModel<Product>>(this.productService$ +'/stores/'+this.storeId$+'/products/'+productId, this.httpOptions$).pipe(
            tap((response : ApiResponseModel<Product>) => {

                this._logging.debug("Response from Product Service in Product Discount Service",response);

                // this._product.next(response.data);
            })
        );

    }

}
