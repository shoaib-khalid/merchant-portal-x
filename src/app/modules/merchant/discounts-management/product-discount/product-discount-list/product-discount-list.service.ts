import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AppConfig } from 'app/config/service.config';
import { JwtService } from 'app/core/jwt/jwt.service';
import { LogService } from 'app/core/logging/log.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { StoreDiscountProduct, StoreDiscountProductPagination } from './product-discount-list.types';
import { Product, ProductPagination } from 'app/core/product/inventory.types';
import { AuthService } from 'app/core/auth/auth.service';

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
    private _productPagination: BehaviorSubject<ProductPagination | null> = new BehaviorSubject(null);
  
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient,
        private _apiServer: AppConfig,
        private _logging: LogService,
        private _authService: AuthService,
        private _jwt: JwtService,
    ){
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

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

    get productpagination$(): Observable<ProductPagination>
    {
        return this._productPagination.asObservable();
    }

    get product$(): Observable<Product>
    {
        return this._product.asObservable();
    }

    get products$(): Observable<Product[]>
    {
        return this._products.asObservable();
    }

    get storeId$(): string
    {
         return localStorage.getItem('storeId') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // Product Discount
    // -----------------------------------------------------------------------------------------------------

    getDiscountProductByDiscountId(discountId:string,page: number = 0, size: number = 5, order: 'asc' | 'desc' | '' = 'asc'): 
        Observable<{ pagination: StoreDiscountProductPagination; products: StoreDiscountProduct[] }>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                sortingOrder: '' + order.toUpperCase(),
            }
        };

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/discount/'+discountId+'/product', header).pipe(
            tap((response) => {

                this._logging.debug("Response from ProductDiscountsService (getDiscountProductByDiscountId)", response);

                let _pagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                this._pagination.next(_pagination);
                this._discountsProduct.next(response.data.content);
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

                this._logging.debug("Response from ProductDiscountsService (getDiscountById)",discount);

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

    getStoreDiscountProduct(discountId: string) : Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        }
        
        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/discount/'+discountId+'/product',header)
            .pipe(
                map((response) => {
                    this._logging.debug("Response from ProductDiscountsService (getStoreDiscountProduct)", response);
                    return response;
                }
            ));
    }

    createProductDiscount(discountId: string, discountProduct:StoreDiscountProduct ): Observable<StoreDiscountProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        }

        return this.discount$.pipe(
            take(1),
            switchMap(_discountProduct => this._httpClient.post<any>(productService + '/stores/' + this.storeId$ + '/discount/' + discountId + '/product' , discountProduct , header).pipe(
                map((newdiscountProduct) => {
                    this._logging.debug("Response from ProductDiscountsService (createProductDiscount)", newdiscountProduct);

                    // Return the new discount
                    return newdiscountProduct;
                })
            ))
        );
    }

    updateProductDiscount(discountId: string, body: StoreDiscountProduct): Observable<StoreDiscountProduct>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        }

        return this.discounts$.pipe(
            take(1),
            // switchMap(discounts => this._httpClient.post<InventoryDiscount>('api/apps/ecommerce/inventory/discount', {}).pipe(
            switchMap(discounts => this._httpClient.put<StoreDiscountProduct>(productService + '/stores/' + this.storeId$ + '/discount/'+ discountId + '/product', body , header).pipe(
                map((updatedDiscount) => {

                    this._logging.debug("Response from ProductDiscountsService (updateProductDiscount)", updatedDiscount);

                    // // Find the index of the updated discount
                    const index = discounts.findIndex(el => el.id === body.id);

                    // // Update the discount
                    discounts[index] = { ...discounts[index], ...updatedDiscount["data"]};

                    // // Update the discounts
                    this._discountsProduct.next(discounts);

                    // Return the updated discount
                    return updatedDiscount["data"];
                }),
                // switchMap(updatedDiscount => this.discount$.pipe(
                //     take(1),
                //     filter(el => el && el.id === body.id),
                //     tap(() => {

                //         this._discountProduct.next(updatedDiscount["data"]);

                //         return updatedDiscount["data"];
                //     })
                // ))
            ))
        );
    }

    deleteDiscountProduct(discountId,discountProductId: string): Observable<boolean>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        }

        return this.discounts$.pipe(
            take(1),
            switchMap(discounts => this._httpClient.delete(productService +'/stores/'+this.storeId$+'/discount/'+discountId + '/product/'+discountProductId, header).pipe(
                map((response) => {
                    
                    this._logging.debug("Response from ProductDiscountsService (deleteDiscountProduct)", response);

                    let isDeleted:boolean = false;
                    if (response['status'] === 200) {
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
    getProducts():Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        }

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/products', header).pipe(
            tap((response) => {

                this._logging.debug("Response from Product Service in ProductDiscountsService (getProducts)",response);

                // this._products.next(response.data);
            })
        );
    }

    getProductById(productId:string):Observable<any>
    {
        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
        }

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/products/'+productId, header).pipe(
            tap((response) => {

                this._logging.debug("Response from Product Service in ProductDiscountsService (getProductById)",response);

                // this._product.next(response.data);
            })
        );

    }

    getByQueryProducts(page: number = 0, size: number = 20, sort: string = 'name', order: 'asc' | 'desc' | '' = 'asc', search: string = '', status: string = 'ACTIVE,INACTIVE',categoryId?:string):
    Observable<{ pagination: ProductPagination; products: Product[] }>
    {

        let productService = this._apiServer.settings.apiServer.productService;
        let accessToken = this._jwt.getJwtPayload(this._authService.jwtAccessToken).act;
        let clientId = this._jwt.getJwtPayload(this._authService.jwtAccessToken).uid;

        const header = {
            headers: new HttpHeaders().set("Authorization", `Bearer ${accessToken}`),
            params: {
                page        : '' + page,
                pageSize    : '' + size,
                sortByCol   : '' + sort,
                sortingOrder: '' + order.toUpperCase(),
                name        : '' + search,
                status      : '' + status
            }
        }

        if (categoryId) {
            header.params["categoryId"] = categoryId;
        }

        return this._httpClient.get<any>(productService +'/stores/'+this.storeId$+'/products', header).pipe(
            tap((response) => {

                this._logging.debug("Response from Product Service in ProductDiscountsService (getByQueryProducts)",response);

                let _productPagination = {
                    length: response.data.totalElements,
                    size: response.data.size,
                    page: response.data.number,
                    lastPage: response.data.totalPages,
                    startIndex: response.data.pageable.offset,
                    endIndex: response.data.pageable.offset + response.data.numberOfElements - 1
                }
                this._productPagination.next(_productPagination);
                this._products.next(response.data.content);
            })
        );
    }
}
